package canD

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"telemetry/pkg/msgs"
	"testing"
	"time"
)

func TestEnd2End(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	defer db.Close()
	if err != nil {
		t.Errorf("Failed to open in memory db " + err.Error())
	}
	createTbl := `
  CREATE TABLE 
    can (id INTEGER NOT NULL, timestamp DATETIME NOT NULL, data INTEGER NOT NULL);`
	_, err = db.Exec(createTbl)
	if err != nil {
		t.Errorf("Failed to create table " + err.Error())
	}

	tm := time.Date(2009, 11, 17, 20, 34, 58, 651387237, time.UTC)
	msg := msgs.CAN{ID: 1, Timestamp: tm, Data: 2}
	err = WriteMsg(db, msg)
	if err != nil {
		t.Errorf("WriteMsg failed " + err.Error())
	}

	before := tm.AddDate(0, 0, -1)
	after := tm.AddDate(0, 0, 1)

	msgs, err := TimeWindowedRead(db, 1, after, before)
	if err != nil {
		t.Errorf("TimeWindowedRead failed " + err.Error())
	} else if len(msgs) != 1 {
		t.Errorf("msgs length is not 1: %d", len(msgs))
	} else if msgs[0] != msg {
		t.Errorf("Message is not correct")
	}
}
