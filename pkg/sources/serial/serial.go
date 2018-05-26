package serial

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"os"

	log "github.com/golang/glog"
	"github.com/jacobsa/go-serial/serial"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

type canPacket struct {
	header uint32
	id     uint32
	data   uint64
}

const canPacketBytes = 16

// Run starts reading canPacket from the specified serial port and serving those on bus.
func Run(port string, bus *pubsub.MessageBus) {
	options := serial.OpenOptions{
		PortName:        port,
		BaudRate:        115200,
		DataBits:        8,
		StopBits:        1,
		MinimumReadSize: 4,
	}

	tty, err := serial.Open(options)
	if err != nil {
		log.Fatal("Port failed to open", err)
		os.Exit(-1)
	}
	defer tty.Close()

	for {
		buf := make([]byte, canPacketBytes)
		n, err := tty.Read(buf)
		if err != nil {
			if err != io.EOF {
				fmt.Println("Error: failed to read from port", err)
			}
		} else {
			packet := canPacket{}
			binary.Read(bytes.NewBuffer(buf[:n]), binary.LittleEndian, &packet)
			bus.Publish("CAN", msgs.NewCAN(packet.id, packet.data))
		}
	}
}
