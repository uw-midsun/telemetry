package fake

import (
	"math"
	"time"

	"github.com/gorilla/websocket"

	"telemetry/pkg/msgs"
)

const (
	// interval between fake data readings
	readInterval = 20 * time.Millisecond
)

var startTime = time.Now()

func getBattery(id uint16) msgs.TelemetryData {
	t := time.Since(startTime)
	fid := float64(id)
	voltage := uint16(33000 + 3000*math.Sin((t.Seconds()/20)+fid))
	temperature := float32(33000 + 3000*math.Sin((t.Seconds()/20)+fid))

	return msgs.NewTelemetryData(&msgs.BatteryModule{
		ID:          id,
		Voltage:     voltage,
		Temperature: temperature,
	})
}

// GenFake generates fake data
// TODO: make this pub-sub, and write to channel instead of directly to websocket
func GenFake(conn *websocket.Conn) {
	for {
		for battery := uint16(1); battery <= 36; battery++ {
			conn.WriteJSON(getBattery(battery))
		}
		time.Sleep(readInterval)
	}
}
