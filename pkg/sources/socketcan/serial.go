package socketcan

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"io"
	"os"
	"fmt"

	log "github.com/golang/glog"
	"github.com/jacobsa/go-serial/serial"
	"github.com/mrVanboy/go-simple-cobs"

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
)

const canRxHeader = 0x585243

type canPacket struct {
	Header uint32
	ID     uint32
	Data   uint64
}

// Run starts reading canPacket from the specified serial port and serving those on bus.
func Run(port string, bus *pubsub.MessageBus) {
    fmt.Println("hello world")
}
