package serial

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"io"
	"os"

	log "github.com/golang/glog"
	"github.com/jacobsa/go-serial/serial"
	"github.com/mrVanboy/go-simple-cobs"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

const canRxHeader = 0x585243

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

	// Discard the first message as it may be garbled due to power/serial timings.
	buf, err := reader.ReadBytes(0x00)
	for {
		// Read a complete message at a time. (Blocking).
		buf, err = reader.ReadBytes(0x00)
		if err != nil {
			// Except io.EOF errors. Output any others.
			if err != io.EOF {
				log.Errorf("Error: failed to read from port", err)
			}
		} else {
			decoded, err := cobs.Decode(buf[:len(buf)-1])
			if err != nil {
				log.Errorf("Error: cobs failed to decode", err)
				continue
			}
			// Parse the input and store it into a canPacket. Note that this ignores
			// the header and the newline.
			packet := canPacket{}
			binary.Read(bytes.NewBuffer(decoded), binary.LittleEndian, &packet)
			hdr := packet.Header & 0xFFFFFF
			dlc := uint8((packet.Header >> 28) & 0xF)
			if hdr == canRxHeader {
				bus.Publish("CAN", msgs.NewCAN(packet.ID, packet.Data, dlc))
			}
		}
	}
}
