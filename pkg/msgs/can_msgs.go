package msgs

import (
	"time"
)

// CAN describes a single message from the CAN bus.
type CAN struct {
	ID        uint32    `json:"id"`
	Timestamp uint64    `json:"timestamp"`
	Data64    uint64    `json:"data64"`
	Data32    [2]uint32 `json:"data32"`
	Data16    [4]uint16 `json:"data16"`
	Data8     [8]uint8  `json:"data8"`
}

// NewCAN creates a CAN struct, this should be used for all incoming messages.
func NewCAN(id uint32, data uint64) CAN {
	return CAN{
		id,
		uint64(time.Now().UnixNano()) / uint64(time.Millisecond),
		data,
		[2]uint32{
			uint32((data >> 32) & 0xFFFFFFFF),
			uint32(data & 0xFFFFFFFF),
		},
		[4]uint16{
			uint16(data & 0xFFFF),
			uint16((data >> 16) & 0xFFFF),
			uint16((data >> 32) & 0xFFFF),
			uint16((data >> 48) & 0xFFFF),
		},
		[8]uint8{
			uint8(data & 0xFF),
			uint8((data >> 8) & 0xFF),
			uint8((data >> 16) & 0xFF),
			uint8((data >> 24) & 0xFF),
			uint8((data >> 32) & 0xFF),
			uint8((data >> 40) & 0xFF),
			uint8((data >> 48) & 0xFF),
			uint8((data >> 56) & 0xFF),
		}}
}
