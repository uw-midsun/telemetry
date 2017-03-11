package msgs

import (
	"time"
)

// CAN describes the data stored inside messages from the CAN bus.
type CAN interface {
	// New creates a new message, preserving id and other meta information.
	New() CAN
}

// TelemetryData is what we return to the user
type TelemetryData struct {
	CAN   CAN
	CANID uint16
	Time  time.Time
}

// GetID gets the CAN id
func GetID(msg CAN) uint16 {
	// TODO: enable the CAN message mapping with reflection
	// for now, we'll just return a fixed id
	// msgType := reflect.TypeOf(msg)

	return 0
}

// NewTelemetryData creates a TelemetryData struct
func NewTelemetryData(msg CAN) TelemetryData {
	return TelemetryData{msg, GetID(msg), time.Now().UTC()}
}
