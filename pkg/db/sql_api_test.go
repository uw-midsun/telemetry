package candb

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"telemetry/pkg/msgs"
	"testing"
	"time"
)

func msgsEqual(expected msgs.CAN, actual msgs.CAN) bool {
	eStrs := expected.ToSlice()
	aStrs := actual.ToSlice()
	eLen := len(eStrs)
	if eLen != len(aStrs) {
		return false
	}
	for i := 0; i < eLen; i++ {
		if eStrs[i] != aStrs[i] {
			return false
		}
	}
	return true
}

func TestEnd2End(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	defer db.Close()
	if err != nil {
		t.Errorf("Failed to open in memory db " + err.Error())
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
		t.Errorf("Failed to create table " + err.Error())
	}

	tm := time.Date(2009, 11, 17, 20, 34, 58, 651387237, time.UTC)
	data := make(map[string]interface{})
	data["raw"] = 1
	msg := msgs.CAN{ID: 1, Timestamp: uint64(tm.UnixNano()) / uint64(time.Millisecond), Data: data, DLC: 0, RTR: false, Source: 1}
	err = WriteMsg(db, msg)
	if err != nil {
		t.Errorf("WriteMsg failed " + err.Error())
	}

	before := tm.AddDate(0, 0, -1)
	after := tm.AddDate(0, 0, 1)

	msgs, err := TimeWindowedRead(db, 1, before, after)
	if err != nil {
		t.Errorf("TimeWindowedRead failed " + err.Error())
	} else if len(msgs) != 1 {
		t.Errorf("msgs length is not 1: %d", len(msgs))
	} else if !msgsEqual(msgs[0], msg) {
		t.Errorf("Message is not correct")
	}
}
