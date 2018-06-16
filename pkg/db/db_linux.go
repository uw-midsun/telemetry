// +build linux
// +build !arm

package candb

import (
	"database/sql"
	"sync"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

// RunDb creates a table and sinks all "CAN" pubsub messages into it via the WirteMsg method.
func RunDb(bus *pubsub.MessageBus, dbName string) {
	db, err := sql.Open("sqlite3", dbName)
	defer db.Close()
	if err != nil {
		log.Errorf("Failed to open in memory db " + err.Error())
	}
	createTbl := `
      CREATE TABLE IF NOT EXISTS
        can (source INTEGER NOT NULL,
             id INTEGER NOT NULL,
             rtr INTEGER NOT NULL,
             timestamp DATETIME NOT NULL,
             data TEXT NOT NULL);`
	_, err = db.Exec(createTbl)
	if err != nil {
		log.Errorf("Failed to create table " + err.Error())
	}
	l := sync.Mutex{}
	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		_ = WriteMsg(db, msg)
	})
	for {
		select {}
	}
}
