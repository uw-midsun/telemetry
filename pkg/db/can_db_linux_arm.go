// +build linux
// +build arm

package candb

import (
	"bufio"
	"encoding/csv"
	"os"
	"sync"

	log "github.com/golang/glog"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

// RunDb on ARM uses a logfile since there is no sqlite driver for armeabi-v7a.
func RunDb(bus *pubsub.MessageBus, dbName string) {
	f, err := os.OpenFile(dbName, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		log.Errorf("Failed to open db log", err.Error())
		return
	}

	w := bufio.NewWriter(f)
	l := sync.Mutex{}
	csv := csv.NewWriter(w)
	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		csv.Write(msg.ToSlice())
	})
}
