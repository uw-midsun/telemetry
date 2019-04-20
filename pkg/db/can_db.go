// +build !arm

package candb

import (
	"database/sql"
	"sync"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
)

// RunDb creates a table and sinks all "CAN" pubsub messages into it via the WriteMsg method.
func RunDb(bus *pubsub.MessageBus, dbName string) {
	db, err := sql.Open("sqlite3", dbName)
	if err != nil {
		log.Errorf("Failed to open db " + err.Error())
		return
	}
	createTbl := `
      CREATE TABLE IF NOT EXISTS
        can (source INTEGER NOT NULL,
             id INTEGER NOT NULL,
             rtr INTEGER NOT NULL,
             dlc INTEGER NOT NULL,
             timestamp INTEGER NOT NULL,
             data TEXT NOT NULL);`
	_, err = db.Exec(createTbl)
	if err != nil {
		log.Errorf("Failed to create table " + err.Error())
	}
	l := sync.Mutex{}
	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		err = WriteMsg(db, msg)
		if err != nil {
			log.Errorf("Failed to write " + err.Error())
		}
	})
}
