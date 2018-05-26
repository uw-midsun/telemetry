package msgs

import (
	"time"
)

// CAN describes a single message from the CAN bus.
type CAN struct {
	ID        uint32 `json:"id"`
	Timestamp uint64 `json:"timestamp"`
	Data      uint64 `json:"data"`
}

// NewCAN creates a CAN struct, this should be used for all incoming messages.
func NewCAN(id uint32, data uint64) CAN {
	return CAN{id, uint64(time.Now().UnixNano()) / uint64(time.Millisecond), data}
}
