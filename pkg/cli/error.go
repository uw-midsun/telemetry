package cli

import (
	"github.com/pkg/errors"
	"github.com/spf13/cobra"
)

func usageAndError(cmd *cobra.Command) error {
	if err := cmd.Usage(); err != nil {
		return err
	}
	return errors.New("invalid arguments")
}
