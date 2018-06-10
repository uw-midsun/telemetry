package cli

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"database/sql"
	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // impl
	"github.com/pressly/chi"
	"github.com/spf13/cobra"

	"telemetry/pkg/db"
	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
	"telemetry/pkg/ws"

	"sync"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "start the telemetry server",
	Long: `
	Start the telemetry server, which will start listening for data on
	the input device specified via the --source flags
	`,
	Example: `  telemetry start [--port=port] [--fake] [--tty=/dev/...]`,
	RunE:    runStart,
}

// ErrorCode is the value to be used by main() as exit code in case of
// error. For most errors 1 is appropriate, but a signal termination
// can change this.
var ErrorCode = 1

var fake bool
var serverPort int
var ttyPort string
var dbName string

func init() {
	startCmd.Flags().BoolVarP(&fake, "fake", "f", false, "fake")
	startCmd.Flags().IntVarP(&serverPort, "port", "p", 8080, "port")
	startCmd.Flags().StringVarP(&ttyPort, "tty", "t", "/dev/ttyUSB0", "tty")
	startCmd.Flags().StringVarP(&dbName, "db", "d", "", "db")
}

func setupURLRouting(r *chi.Mux, messageBus *pubsub.MessageBus) {
	r.Get("/ws", ws.ServeHTTP(messageBus, ttyPort, fake))
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, "client", "src")
	r.FileServer("/", http.Dir(filesDir))

	port := fmt.Sprintf(":%d", serverPort)
	log.Infof("Starting HTTP server on %s", port)
	log.Fatal(http.ListenAndServe(port, r))
}

func runDb(bus *pubsub.MessageBus) {
	db, err := sql.Open("sqlite3", dbName)
	defer db.Close()
	if err != nil {
		log.Errorf("Failed to open in memory db " + err.Error())
	}
	createTbl := `
      CREATE TABLE IF NOT EXISTS
        can (id INTEGER NOT NULL, timestamp DATETIME NOT NULL, data INTEGER NOT NULL);`
	_, err = db.Exec(createTbl)
	if err != nil {
		log.Errorf("Failed to create table " + err.Error())
	}
	l := sync.Mutex{}
	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		_ = candb.WriteMsg(db, msg)
	})
	for {
		select {}
	}
}

// runStart
func runStart(cmd *cobra.Command, args []string) error {
	if len(args) > 0 {
		return usageAndError(cmd)
	}

	// TODO(karl): change this so the process can be "daemonized"
	r := chi.NewRouter()
	messageBus := pubsub.New()
	if dbName != "" {
		go runDb(messageBus)
	}
	setupURLRouting(r, messageBus)
	return nil
}

// restartBackground restarts the process in the background (like a daemon)
func restartBackground() {
	args := make([]string, 0, len(os.Args))

	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
}
