// +build linux
// +build arm

package candb

import (
	"telemetry/pkg/pubsub"
)

// RunDb on ARM is a no-op as there in no sqlite database driver for the platform.
func RunDb(bus *pubsub.MessageBus, dbName string) {
	// No-op on arm as there is no database support.
}
