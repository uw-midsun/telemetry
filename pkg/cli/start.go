package cli

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/pressly/chi"
	"github.com/spf13/cobra"

	"telemetry/pkg/pubsub"
	"telemetry/pkg/ws"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "start the telemetry server",
	Long: `
	Start the telemetry server, which will start listening for data on
	the input device specified via the --source flags
	`,
	Example: `  telemetry start -source=/dev/tty.* [--port=port]`,
	RunE:    runStart,
}

// ErrorCode is the value to be used by main() as exit code in case of
// error. For most errors 1 is appropriate, but a signal termination
// can change this.
var ErrorCode = 1

var serverPort int

func init() {
	startCmd.Flags().IntVarP(&serverPort, "port", "p", 8080, "port")
}

// runStart
func runStart(cmd *cobra.Command, args []string) error {
	if len(args) > 0 {
		return usageAndError(cmd)
	}

	// TODO(karl): change this so the process can be "daemonized"
	messageBus := pubsub.New()
	r := chi.NewRouter()
	r.Get("/ws", ws.ServeHTTP(messageBus))
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, "client", "src")
	r.FileServer("/", http.Dir(filesDir))

	port := fmt.Sprintf(":%d", serverPort)
	http.ListenAndServe(port, r)
	return nil
}

// restartBackground restarts the process in the background (like a daemon)
func restartBackground() {
	args := make([]string, 0, len(os.Args))

	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
}
