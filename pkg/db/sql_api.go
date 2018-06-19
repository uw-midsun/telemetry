package candb

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"time"

	"telemetry/pkg/msgs"
)

// WriteMsg commits a CAN message to the database.
func WriteMsg(db *sql.DB, msg msgs.CAN) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	insert, err := tx.Prepare(`
    INSERT INTO can(source, id, rtr, timestamp, data) VALUES(?, ?, ?, ?, ?)
  `)
	if err != nil {
		return err
	}
	defer insert.Close()

	rtrbit := 0
	if msg.RTR {
		rtrbit = 1
	}

	b := new(bytes.Buffer)
	e := json.NewEncoder(b)
	err = e.Encode(msg.Data)
	if err != nil {
		return err
	}
	_, err = insert.Exec(msg.Source, msg.ID, rtrbit, msg.Timestamp, b.String())
	if err != nil {
		return err
	}

	tx.Commit()
	return nil
}

// TimeWindowedRead reads msgs between to and from with the provided id.
func TimeWindowedRead(db *sql.DB, canID uint16, from time.Time, to time.Time) ([]msgs.CAN, error) {
	rows, err := db.Query(`
    SELECT
      can.source,
      can.id,
      can.rtr,
      can.timestamp,
      can.data
    FROM
      can
    WHERE
     can.id = ?
     AND can.timestamp <= ?
     AND can.timestamp >= ?
    `, canID, to, from)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var canMsgs []msgs.CAN
	for rows.Next() {
		b := new(bytes.Buffer)
		var msg msgs.CAN
		var data string
		err = rows.Scan(&msg.Source, &msg.ID, &msg.RTR, &msg.Timestamp, &data)
		if err != nil {
			return nil, err
		}
		b.WriteString(data)
		d := json.NewDecoder(b)
		d.Decode(&msg.Data)
		canMsgs = append(canMsgs, msg)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return canMsgs, nil
}
