package ws

import (
	"net/http"
	"time"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
	"telemetry/pkg/sources/fake"

	"sync"

	"github.com/gorilla/websocket"
)

const (
	// Time between pinging for presence.
	pingPeriod = 30 * time.Second
	// Maximum time to wait when trying to send a message to the client.
	writeWait = time.Second
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(_ *http.Request) bool {
		return true
	},
}

// handleMessages handles messages on the websocket
func handleMessages(bus *pubsub.MessageBus, conn *websocket.Conn) {
	// pingTicker := time.NewTicker(pingPeriod)
	// defer pingTicker.Stop()

	// the websocket cannot be concurrently written to
	l := sync.Mutex{}

	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		conn.WriteJSON(msg)
	})

	for {
		// TODO: actually parse received messages for bidirectional data exchange
		// msgType, message, err := conn.ReadMessage()
		fake.GenFake(bus)
	}
}

// ServeHTTP serves the websocket connection
func ServeHTTP(b *pubsub.MessageBus) func(http.ResponseWriter, *http.Request) {
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

		handleMessages(b, conn)
	}
}
