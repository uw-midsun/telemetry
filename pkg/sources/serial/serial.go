package serial

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"io"
	"os"

	log "github.com/golang/glog"
	"github.com/jacobsa/go-serial/serial"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

type canPacket struct {
	Header uint32
	ID     uint32
	Data   uint64
}

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
	reader := bufio.NewReader(tty)

	for {
		// Need to read an extra byte to account for null char.
		buf, err := reader.ReadBytes('\n')
		if err != nil {
			if err != io.EOF {
				log.Error("Error: failed to read from port", err)
			}
		} else {
			packet := canPacket{}
			binary.Read(bytes.NewBuffer(buf), binary.LittleEndian, &packet)
			log.Info(buf)
			log.Info(packet.ID, packet.Data)
			bus.Publish("CAN", msgs.NewCAN(packet.ID, packet.Data))
		}
	}
}
