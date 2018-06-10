package candb

import (
	"database/sql"
	"telemetry/pkg/msgs"
	"time"
)

// WriteMsg commits a CAN message to the database.
func WriteMsg(db *sql.DB, msg msgs.CAN) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	insert, err := tx.Prepare("INSERT INTO can(id, timestamp, data) VALUES(?, ?, ?)")
	if err != nil {
		return err
	}

	defer insert.Close()

	insert.Exec(msg.ID, msg.Timestamp, msg.Data64)

	tx.Commit()
	return nil
}

// TimeWindowedRead reads msgs between to and from with the provided id.
func TimeWindowedRead(db *sql.DB, canID uint16, from time.Time, to time.Time) ([]msgs.CAN, error) {
	rows, err := db.Query(`
    SELECT
      can.id,
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
		var msg msgs.CAN
		err = rows.Scan(&msg.ID, &msg.Timestamp, &msg.Data64)
		if err != nil {
			return nil, err
		}
		canMsgs = append(canMsgs, msg)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return canMsgs, nil
}
