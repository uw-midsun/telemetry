package cli

import (
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "start the telemetry server",
	Long: `
			Start the telemetry server, which will start listening for data on
			the input device specified via the --source flags
			`,
	Example: `  telemetry start -source=attrs=ssd,path=/mnt/ssd1 [--join=host:port,[host:port]]`,
	RunE:    runStart,
}

// ErrorCode is the value to be used by main() as exit code in case of
// error. For most errors 1 is appropriate, but a signal termination
// can change this.
var ErrorCode = 1

// runStart
func runStart(cmd *cobra.Command, args []string) error {
	if len(args) > 0 {
		return usageAndError(cmd)
	}
	return nil
}
