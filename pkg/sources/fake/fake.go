package fake

import (
	"math"
	"time"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
	"telemetry/pkg/util/randutil"
)

const (
	// interval between fake data readings
	readInterval = 400 * time.Millisecond
)

const (
	// TODO(karlding): change these to the actual values
	rightTurnOn = iota
	rightTurnOff
	leftTurnOn
	leftTurnOff
	hazardOn
	hazardOff
	solarPowerLevel
	motorPowerLevel
	batteryState
	cruiseOn
	cruiseLevel
	cruiseOff
	speed
)

var startTime = time.Now()

var rightTurnState = false
var leftTurnState = false
var hazardState = false
var cruiseControlState = false

func getCAN(id uint32) msgs.CAN {
	t := time.Since(startTime)
	fid := float64(id)
	data := uint64(800 + 150*math.Sin((t.Seconds()/20)+fid))

	return msgs.NewCAN(id, data)
}

// GenFake generates fake data
func GenFake(bus *pubsub.MessageBus) {
	batteryValue := uint64(0)
	rand, _ := randutil.NewPseudoRand()
	for {
		// motor power
		getCAN(motorPowerLevel)
		bus.Publish("CAN", getCAN(motorPowerLevel))

		// solar power
		bus.Publish("CAN", getCAN(solarPowerLevel))

		// battery state
		if uint64(randutil.RandIntInRange(rand, 0, 5)) == 0 {
			batteryValue = uint64(randutil.RandIntInRange(rand, 0, 100))
			bus.Publish("CAN", msgs.NewCAN(batteryState, batteryValue))
		}

		// turn signals
		if randutil.RandIntInRange(rand, 0, 10) == 0 {
			if hazardState {
				bus.Publish("CAN", msgs.NewCAN(hazardOff, 0))
				hazardState = false
			}
			// toggle turn signal state
			if randutil.RandIntInRange(rand, 0, 2) == 1 {
				if rightTurnState {
					bus.Publish("CAN", msgs.NewCAN(rightTurnOff, 0))
				} else {
					if leftTurnState {
						leftTurnState = false
						bus.Publish("CAN", msgs.NewCAN(leftTurnOff, 0))
					}
					bus.Publish("CAN", msgs.NewCAN(rightTurnOn, 0))
				}
				rightTurnState = !rightTurnState
			} else {
				if leftTurnState {
					bus.Publish("CAN", msgs.NewCAN(leftTurnOff, 0))
				} else {
					if rightTurnState {
						rightTurnState = false
						bus.Publish("CAN", msgs.NewCAN(rightTurnOff, 0))
					}
					bus.Publish("CAN", msgs.NewCAN(leftTurnOn, 0))
				}
				leftTurnState = !leftTurnState
			}
		}

		if randutil.RandIntInRange(rand, 0, 40) == 0 {
			if rightTurnState {
				bus.Publish("CAN", msgs.NewCAN(rightTurnOff, 0))
				rightTurnState = false
			}
			if leftTurnState {
				bus.Publish("CAN", msgs.NewCAN(leftTurnOff, 0))
				leftTurnState = false
			}

			bus.Publish("CAN", msgs.NewCAN(hazardOn, 0))
			hazardState = true
		}

		// cruise control
		if randutil.RandIntInRange(rand, 0, 60) == 0 {
			cruiseControlState = !cruiseControlState
			if cruiseControlState {
				bus.Publish("CAN", msgs.NewCAN(cruiseOn, 0))
			} else {
				bus.Publish("CAN", msgs.NewCAN(cruiseOff, 0))
			}
		}
		if cruiseControlState {
			if randutil.RandIntInRange(rand, 0, 5) == 0 {
				speed := randutil.RandIntInRange(rand, 0, 100)
				bus.Publish("CAN", msgs.NewCAN(cruiseLevel, uint64(speed)))
			}
		}

		// speed

		value := 50*math.Sin(float64(5*time.Now().UnixNano()/int64(time.Millisecond))) + 50
		bus.Publish("CAN", msgs.NewCAN(speed, uint64(value)))

		time.Sleep(readInterval)
	}
}
