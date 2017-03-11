package msgs

// BatteryModule holds the battery data for a particular battery module
type BatteryModule struct {
	ID          uint16
	Voltage     uint16
	Temperature float32
}

// get CAN ID
func (b BatteryModule) canID() uint16 {
	return b.ID
}

// New creates a new BatteryModule
func (b BatteryModule) New() CAN {
	return &BatteryModule{ID: b.ID}
}
