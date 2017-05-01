package msgs

import (
	"time"
)

// CAN describes a single message from the CAN bus.
type CAN struct {
	ID        uint16    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Data      uint64    `json:"data"`
}

// NewCAN creates a CAN struct, this should be used for all incoming messages.
func NewCAN(id uint16, data uint64) CAN {
	return CAN{id, time.Now().UTC(), data}
}
