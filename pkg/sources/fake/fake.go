package fake

import (
	"math"
	"time"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

const (
	// interval between fake data readings
	readInterval = 20 * time.Millisecond
)

var startTime = time.Now()

func getCAN(id uint16) msgs.CAN {
	t := time.Since(startTime)
	fid := float64(id)
	data := uint16(33000 + 3000*math.Sin((t.Seconds()/20)+fid))

	return msgs.NewCAN(id, data)
}

// GenFake generates fake data
func GenFake(bus *pubsub.MessageBus) {
	for {
		for msg := uint16(1); msg <= 36; msg++ {
			bus.Publish("CAN", getCAN(msg))
		}
		time.Sleep(readInterval)
	}
}
