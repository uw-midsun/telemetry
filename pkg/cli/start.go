package cli

import (
	"crypto/sha256"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi"
	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl
	"github.com/spf13/cobra"

	"telemetry/pkg/db"
	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
	"telemetry/pkg/rest"
	"telemetry/pkg/ws"
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

var source string
var token string
var serverPort int
var ttyPort string
var dbName string
var schemaFile string

func init() {
	startCmd.Flags().StringVarP(&schemaFile, "schema", "s", "", "s")
	startCmd.Flags().IntVarP(&serverPort, "port", "p", 8080, "port")
	startCmd.Flags().StringVarP(
		&source,
		"source", "", "s", "Source of CAN messages. Can be a combination of (s)erial, (r)est, or (f)ake",
	)
	startCmd.Flags().StringVarP(
		&token,
		"token", "", "", "A token to add to the sqlite auth table. Only needs to be specified once per token",
	)
	startCmd.Flags().StringVarP(&ttyPort, "tty", "t", "/dev/ttyUSB0", "tty")
	startCmd.Flags().StringVarP(&dbName, "db", "d", "", "db")
}

func setupURLRouting(r *chi.Mux, messageBus *pubsub.MessageBus, db *sql.DB) error {
	r.Get("/ws", ws.ServeHTTP(messageBus, ttyPort, source))
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, "client", "src")

	// TODO(ELEC-612): Make a different implementation. Mux.FileServer has been
	// deprecated and removed
	r.FileServer("/", http.Dir(filesDir))

	if strings.Contains(source, "r") {
		if db == nil {
			return fmt.Errorf("You did not specify a db. A db is required to start the REST server")
		}
		r.Post("/can/stream", rest.ServeHTTPCurrentStream(messageBus, db))
	}

	port := fmt.Sprintf(":%d", serverPort)
	log.Infof("Starting HTTP server on %s", port)
	log.Fatal(http.ListenAndServe(port, r))

	return nil
}

// runStart
func runStart(cmd *cobra.Command, args []string) error {
	if len(args) > 0 || schemaFile == "" {
		return usageAndError(cmd)
	}
	err := msgs.CanMsgInit(schemaFile)
	if err != nil {
		return fmt.Errorf("Schema file is bad or not found")
	}

	// TODO(karl): change this so the process can be "daemonized"
	r := chi.NewRouter()
	messageBus := pubsub.New()
	if dbName != "" {
		db, err := sql.Open("sqlite3", dbName)

		if err != nil {
			log.Errorf("Failed to open db " + err.Error())
			return err
		}

		if token != "" {
			hashed := sha256.Sum256([]byte(token))
			hashedHex := fmt.Sprintf("%x", hashed)
			_, err := db.Exec("INSERT INTO auth(token) VALUES (?)", hashedHex)
			if err != nil {
				log.Errorf("Could exec db command (add token to db): " + err.Error())
			}
		}

		candb.RunDb(messageBus, db)
		return setupURLRouting(r, messageBus, db)
	}
	return setupURLRouting(r, messageBus, nil)
}

// restartBackground restarts the process in the background (like a daemon)
func restartBackground() {
	args := make([]string, 0, len(os.Args))

	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
}
