package cli

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

// Main is the main entry point for the CLI
func Main() {
	if len(os.Args) == 1 {
		os.Args = append(os.Args, "help")
	}
	if err := Run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "Failed running %q\n", os.Args[1])
		os.Exit(ErrorCode)
	}
}

// Proxy to allow overrides in tests
var osStderr = os.Stderr

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "output version information",
	Long: `
	Output build version information.
	`,
	RunE: func(cmd *cobra.Command, args []string) error {
		tw := tabwriter.NewWriter(os.Stdout, 2, 1, 2, ' ', 0)
		fmt.Fprintf(tw, "Version:    %s\n", 1)
		return tw.Flush()
	},
}

var telemetryCmd = &cobra.Command{
	Use:   "telemetry [command] (flags)",
	Short: "Telemetry command-line interface",
	Long:  "Telemetry command-line interface",
}

func init() {
	cobra.EnableCommandSorting = false

	telemetryCmd.AddCommand(
		startCmd,

		// Miscellaneous commands
		versionCmd,
	)
}

// Run ...
func Run(args []string) error {
	telemetryCmd.SetArgs(args)
	return telemetryCmd.Execute()
}
