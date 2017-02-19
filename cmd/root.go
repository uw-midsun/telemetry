package cmd

import (
	"github.com/spf13/cobra"
)

// RootCmd is the root for all hello commands.
var RootCmd = &cobra.Command{
	Use:           "hello",
	Short:         "Say hello",
	Long:          `Currently, just say hello.`,
	SilenceErrors: true,
}
