package cli

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi"
	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/uw-midsun/telemetry/pkg/db"
	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
	"github.com/uw-midsun/telemetry/pkg/ws"
	"github.com/uw-midsun/telemetry/pkg/rest"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "start the telemetry server",
	Long: `
	Start the telemetry server, which will start listening for data on
	the input device specified via the --source flags
	`,
	Example: `
	telemetry start --schema=/foo.asciipb
									[--port=port]
									[--source=(s|f|r)]
									[--rest]
									[--tty=/dev/...]
									[--db=a.db]
	`,
	RunE: runStart,
}

// ErrorCode is the value to be used by main() as exit code in case of
// error. For most errors 1 is appropriate, but a signal termination
// can change this.
var ErrorCode = 1

var envPrefix = "uwmidsuntelem"

func init() {
	startCmd.Flags().String("schema", "", "The location of the CAN message schema")
	startCmd.Flags().Int("serverPort", 8080, "The port to setup the HTTP port on")
	startCmd.Flags().String("interface", "/dev/ttyUSB0", "The interface to listen on")
	startCmd.Flags().String("dbConnectString", "", "The connect string to use for the database")
	startCmd.Flags().String("token", "", "Permanently add a new token to the sqlite auth table")
	startCmd.Flags().String("source", "s", "Source of CAN messages. Can be a combination of (s)erial, (r)est, or (f)ake")
	startCmd.Flags().String("dbDriver", "sqlite3", "The DB driver to use")
	startCmd.Flags().Bool("sendtoremote", false, "If CAN data should be sent to a remote server")

	viper.SetEnvPrefix(envPrefix)
	viper.AutomaticEnv()
	viper.BindPFlags(startCmd.Flags())
}

func setupFileServer(r *chi.Mux, endpoint string, filesDir string) {
	if !strings.HasSuffix(endpoint, "/") {
			panic("Endpoint must be a folder type")
	}
	fileServer := http.StripPrefix(
		endpoint,
	  http.TimeoutHandler(http.FileServer(http.Dir(filesDir)), 5 * time.Second, "Failed to serve file"),
	)
	log.Infof("Mounting fileserver from %s", filesDir)
	endpoint += "*"
	r.Get(endpoint, func (w http.ResponseWriter, r *http.Request) {
			fileServer.ServeHTTP(w, r)
		},
	)
}

func setupURLRouting(r *chi.Mux, messageBus *pubsub.MessageBus, db *sql.DB) error {
	ttyPort := viper.GetString("interface")
	source := viper.GetString("source")
	serverPort := viper.GetInt("serverPort")

	r.Get("/ws", ws.ServeHTTP(messageBus, ttyPort, source))
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, "client", "src")

	setupFileServer(r, "/", filesDir)

	if strings.Contains(source, "r") {
		if db == nil {
			return fmt.Errorf("You did not specify a db. A db is required to start the REST server")
		}
		r.Post(rest.JSONStreamEndpoint, rest.ServeHTTP(messageBus, db))
	}

	port := fmt.Sprintf(":%d", serverPort)
	log.Infof("Starting HTTP server on %s", port)

	if viper.GetBool("sendtoremote") {
		rest.RunClient(messageBus)
	}

	// TODO(karl): change this so the process can be "daemonized"
	server := &http.Server{
		Addr: port,
		Handler: r,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout: 6 * time.Hour,
	}
	log.Fatal(server.ListenAndServe())

	return nil
}

// runStart
func runStart(cmd *cobra.Command, args []string) error {
	schemaFile := viper.GetString("schema")
	dbDriver := viper.GetString("dbDriver")
	dbConnectString := viper.GetString("dbConnectString")
	token := viper.GetString("token")

	if len(args) > 0 || schemaFile == "" {
		return fmt.Errorf("Schema file not specified")
	}
	err := msgs.CanMsgInit(schemaFile)
	if err != nil {
		return fmt.Errorf("Schema file is bad or not found")
	}

	r := chi.NewRouter()
	messageBus := pubsub.New()
	var db *sql.DB

	if dbConnectString != "" {

		db, err = sql.Open(dbDriver, dbConnectString)

		if err != nil {
			log.Errorf("Failed to open db " + err.Error())
			return err
		}

		rest.InitAuthDb(db)
		rest.AddTokenToDb(token, db)
		candb.RunDb(messageBus, db)

	}
	return setupURLRouting(r, messageBus, db)
}

// restartBackground restarts the process in the background (like a daemon)
func restartBackground() {
	args := make([]string, 0, len(os.Args))

	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
}
