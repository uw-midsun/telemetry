package socketcan

import (
	"encoding/binary"
	"fmt"
	"github.com/linklayer/go-socketcan/pkg/socketcan"
	"os"

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"

	log "github.com/golang/glog"
)

// Run starts reading canPacket from the specified serial port and serving those on bus.
func Run(port string, bus *pubsub.MessageBus) {
	log.Infof("SocketCAN %s", port)
	device, err := socketcan.NewRawInterface(port)

	if err != nil {
		fmt.Printf("could not open interface %s: %v\n",
			port, err)
		os.Exit(1)
	}

	defer device.Close()

	for {
		frame, err := device.RecvFrame()
		if err != nil {
			fmt.Printf("error receiving frame: %v", err)
			os.Exit(1)
		}
		//dataStr := dataToString(frame.Data)
		//dataInt, _ := strconv.ParseInt(string(frame.Data), 10, 64)
		//fmt.Printf(" %s\t%03X\t[%d]\t%s\n", device.IfName, frame.ArbId, frame.Dlc, dataStr)
		//log.Infof("Device: %s, Data: %i, DLC: %s\n", frame.ArbId, dataInt, frame.Dlc)
		data := binary.LittleEndian.Uint64(frame.Data)
		bus.Publish("CAN", msgs.NewCAN(frame.ArbId, uint64(data), uint8(frame.Dlc)))
	}
}
