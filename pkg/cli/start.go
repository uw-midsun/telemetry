package cli

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	log "github.com/golang/glog"
	"github.com/go-chi/chi"
	"github.com/spf13/cobra"
	_ "github.com/mattn/go-sqlite3" // DB impl

	"telemetry/pkg/db"
	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
	"telemetry/pkg/ws"
	"telemetry/pkg/rest"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "start the telemetry server",
	Long: `
	Start the telemetry server, which will start listening for data on
	the input device specified via the --source flags
	`,
	Example: `  telemetry start --schema=/foo.asciipb [--port=port] [--fake] [--tty=/dev/...] [--db=a.db]`,
	RunE:    runStart,
}

// ErrorCode is the value to be used by main() as exit code in case of
// error. For most errors 1 is appropriate, but a signal termination
// can change this.
var ErrorCode = 1

var fake bool
var rest bool
var serverPort int
var ttyPort string
var dbName string
var schemaFile string

func init() {
	startCmd.Flags().StringVarP(&schemaFile, "schema", "s", "", "s")
	startCmd.Flags().IntVarP(&serverPort, "port", "p", 8080, "port")
	startCmd.Flags().BoolVarP(&fake, "fake", "f", false, "fake")
	startCmd.Flags().BoolVarP(&rest, "rest", "r", false, "REST API input as source")
	startCmd.Flags().StringVarP(&ttyPort, "tty", "t", "/dev/ttyUSB0", "tty")
	startCmd.Flags().StringVarP(&dbName, "db", "d", "", "db")
}

func setupURLRouting(r *chi.Mux, messageBus *pubsub.MessageBus, db *DB) error {
	r.Get("/ws", ws.ServeHTTP(messageBus, ttyPort, fake))
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, "client", "src")

	// TODO(ELEC-612): Make a different implementation. Mux.FileServer has been
	// deprecated and removed
	r.FileServer("/", http.Dir(filesDir))

	if db == nil && rest {
		return fmt.Errorf("You did not specify a db. A db is required to start the REST server")
	}

	r.Post("/can/stream", rest.ServeHTTPCurrentStream(messageBus, db))

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
