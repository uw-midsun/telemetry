package msgs

import (
	"time"
)

// CAN describes a single message from the CAN bus.
type CAN struct {
	ID        uint16
	Timestamp time.Time
	Data      uint16
}

// NewCAN creates a CAN struct, this should be used for all incoming messages.
func NewCAN(id uint16, data uint16) CAN {
	return CAN{id, time.Now().UTC(), data}
}
