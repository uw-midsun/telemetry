package fake

import (
	"math"
	"time"

	"github.com/uw-midsun/telemetry/pkg/canmsgdefs"
	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
	"github.com/uw-midsun/telemetry/pkg/util/randutil"
)

const (
	// interval between fake data readings
	readInterval = 400 * time.Millisecond
)

// Constants for ranges for random number generation
const minMcVoltage = 0
const maxMcVoltage = 70
const minMcCurrent = 0
const maxMcCurrent = 10

const minSolarModuleID = 0
const maxSolarModuleID = 4
const minSolarVoltage = 0
const maxSolarVoltage = 100
const minSolarCurrent = 0
const maxSolarCurrent = 10
const minSolarTemp = 15
const maxSolarTemp = 40

const minBatteryVoltage = 978800 // 67.88 V
const maxBatteryVoltage = 986010 // 68.6 V
const minBatteryCurrent = 0
const maxBatteryCurrent = 3400000 // 3.4 A

const minAuxVoltage = 90
const maxAuxVoltage = 200
const minAuxCurrent = 4000000
const maxAuxCurrent = 6000000
const minDcdcVoltage = 140
const maxDcdcVoltage = 160
const minDcdcCurrent = 1000000
const maxDcdcCurrent = 3000000

const rightTurnID = 4
const leftTurnID = 5
const hazardID = 6
const lightStateOn = 1
const lightStateOff = 0

const minCruiseControl = 40000
const maxCruiseControl = 65000

var startTime = time.Now()

var solarFront = false
var rightTurnState = false
var leftTurnState = false
var hazardState = false
var cruiseControlState = false

// Utility functions to generate a 64-bit integer by bitshifting fewer-bit integers
// The 64-bit raw data returned by these functions is big-endian
// (e.g. first value is rightmost in 64 bits, last value is leftmost in 64 bits)
func createDataU8(values ...uint8) uint64 {
	data := uint64(0)
	for index, value := range values {
		data = (data) | uint64(value)<<(uint(index)*8)
	}
	return data
}

func createDataU16(values ...uint16) uint64 {
	data := uint64(0)
	for index, value := range values {
		data = (data) | uint64(value)<<(uint(index)*16)
	}
	return data
}

func createDataU32(values ...uint32) uint64 {
	data := uint64(0)
	for index, value := range values {
		data = (data) | uint64(value)<<(uint(index)*32)
	}
	return data
}

// GenFake generates fake data
func GenFake(bus *pubsub.MessageBus) {
	rand, _ := randutil.NewPseudoRand()
	for {
		// motor power
		if uint64(randutil.RandIntInRange(rand, 0, 5)) == 0 {
			mcVoltage1 := uint16(randutil.RandIntInRange(rand, minMcVoltage, maxMcVoltage))
			mcVoltage2 := uint16(randutil.RandIntInRange(rand, minMcVoltage, maxMcVoltage))
			mcCurrent1 := uint16(randutil.RandIntInRange(rand, minMcCurrent, maxMcCurrent))
			mcCurrent2 := uint16(randutil.RandIntInRange(rand, minMcCurrent, maxMcCurrent))
			bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageMotorControllerVc), createDataU16(mcVoltage1, mcCurrent1, mcVoltage2, mcCurrent2), 2))
		}

		// solar power
		if uint64(randutil.RandIntInRange(rand, 0, 5)) == 0 {
			moduleID := uint16(randutil.RandIntInRange(rand, minSolarModuleID, maxSolarModuleID))
			voltage := uint16(randutil.RandIntInRange(rand, minSolarVoltage, maxSolarVoltage))
			current := uint16(randutil.RandIntInRange(rand, minSolarCurrent, maxSolarCurrent))
			temp := uint16(randutil.RandIntInRange(rand, minSolarTemp, maxSolarTemp))

			solarFront = !solarFront
			if solarFront {
				bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageSolarDataFront), createDataU16(moduleID, voltage, current, temp), 2))
			} else {
				bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageSolarDataRear), createDataU16(moduleID, voltage, current, temp), 2))
			}
		}

		// battery state
		if uint64(randutil.RandIntInRange(rand, 0, 5)) == 0 {
			batteryVoltage := uint32(randutil.RandIntInRange(rand, minBatteryVoltage, maxBatteryVoltage))
			batteryCurrent := uint32(randutil.RandIntInRange(rand, minBatteryCurrent, maxBatteryCurrent))
			bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageBatteryAggregateVc), createDataU32(batteryVoltage, batteryCurrent), 2))
		}

		// aux and dcdc state
		if uint64(randutil.RandIntInRange(rand, 0, 5)) == 0 {
			auxVoltage := uint16(randutil.RandIntInRange(rand, minAuxVoltage, maxAuxVoltage))
			auxCurrent := uint16(randutil.RandIntInRange(rand, minAuxCurrent, maxAuxCurrent))
			dcdcVoltage := uint16(randutil.RandIntInRange(rand, minDcdcVoltage, maxDcdcVoltage))
			dcdcCurrent := uint16(randutil.RandIntInRange(rand, minDcdcCurrent, maxDcdcCurrent))
			bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageAuxDcdcVc), createDataU16(auxVoltage, auxCurrent, dcdcVoltage, dcdcCurrent), 2))
		}

		// turn signals
		if randutil.RandIntInRange(rand, 0, 10) == 0 {
			if hazardState {
				bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(hazardID, lightStateOff), 2))
				hazardState = false
			}
			// toggle turn signal state
			if randutil.RandIntInRange(rand, 0, 2) == 1 {
				if rightTurnState {
					bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(rightTurnID, lightStateOff), 2))
				} else {
					if leftTurnState {
						leftTurnState = false
						bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(leftTurnID, lightStateOff), 2))
					}
					bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(rightTurnID, lightStateOn), 2))
				}
				rightTurnState = !rightTurnState
			} else {
				if leftTurnState {
					bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(leftTurnID, lightStateOff), 2))
				} else {
					if rightTurnState {
						rightTurnState = false
						bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(rightTurnID, lightStateOff), 2))
					}
					bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(leftTurnID, lightStateOn), 2))
				}
				leftTurnState = !leftTurnState
			}
		}

		if randutil.RandIntInRange(rand, 0, 40) == 0 {
			if rightTurnState {
				bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(rightTurnID, lightStateOff), 2))
				rightTurnState = false
			}
			if leftTurnState {
				bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(leftTurnID, lightStateOff), 2))
				leftTurnState = false
			}
			bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageLightsState), createDataU8(hazardID, lightStateOn), 2))
			hazardState = true
		}

		// cruise control
		if randutil.RandIntInRange(rand, 0, 60) == 0 {
			cruiseControlState = !cruiseControlState
		}
		if cruiseControlState {
			if randutil.RandIntInRange(rand, 0, 5) == 0 {
				throttle := uint16(0)
				direction := uint16(randutil.RandIntInRange(rand, 0, 3))
				cruiseControl := uint16(randutil.RandIntInRange(rand, minCruiseControl, maxCruiseControl))
				mechanicalBrakeState := uint16(0)
				bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageDriveOutput), createDataU16(throttle, direction, cruiseControl, mechanicalBrakeState), 4))
			}
		} else {
			throttle := uint16(0)
			direction := uint16(randutil.RandIntInRange(rand, 0, 3))
			cruiseControl := uint16(0)
			mechanicalBrakeState := uint16(0)
			bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageDriveOutput), createDataU16(throttle, direction, cruiseControl, mechanicalBrakeState), 4))
		}

		// speed
		value := uint16(500*math.Sin(float64(5*time.Now().UnixNano()/int64(time.Millisecond))) + 1000)
		bus.Publish("CAN", msgs.NewFakeCAN(0, uint16(canmsgdefs.SystemCanMessageMotorVelocity), createDataU16(value, value/2), 2))

		time.Sleep(readInterval)
	}
}
