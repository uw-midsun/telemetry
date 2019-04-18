package ws

import (
	"net/http"
	"strings"
	"time"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
	"telemetry/pkg/sources/fake"
	"telemetry/pkg/sources/serial"

	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(_ *http.Request) bool {
		return true
	},
}

// handleMessages handles messages on the websocket
func handleMessages(bus *pubsub.MessageBus, conn *websocket.Conn, tty string, source string) {

	// the websocket cannot be concurrently written to
	l := sync.Mutex{}

	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		conn.WriteJSON(msg)
	})

	if strings.Contains(source, "f") {
		for {
			fake.GenFake(bus)
			time.Sleep(time.Millisecond * 500)
		}
	} else if strings.Contains(source, "s") {
		serial.Run(tty, bus)
	}
}

// ServeHTTP serves the websocket connection
func ServeHTTP(b *pubsub.MessageBus, tty string, source string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)

		defer func() {
			if conn != nil {
				conn.Close()
			}
		}()

		if err != nil {
			return
		}

		handleMessages(b, conn, tty, source)
	}
}
