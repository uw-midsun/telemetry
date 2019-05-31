package ws

import (
	"net/http"
	"time"

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
	"github.com/uw-midsun/telemetry/pkg/sources/fake"
	"github.com/uw-midsun/telemetry/pkg/sources/serial"
	"github.com/uw-midsun/telemetry/pkg/sources/socketcan"

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
func handleMessages(bus *pubsub.MessageBus, conn *websocket.Conn, tty string, uf bool, socketCan string) {
	// pingTicker := time.NewTicker(pingPeriod)
	// defer pingTicker.Stop()

	// the websocket cannot be concurrently written to
	l := sync.Mutex{}

	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		conn.WriteJSON(msg)
	})

	if uf {
		for {
			fake.GenFake(bus)
			time.Sleep(time.Millisecond * 500)
		}
	} else {
		socketcan.Run(socketCan, bus)
	}
}

// ServeHTTP serves the websocket connection
func ServeHTTP(b *pubsub.MessageBus, tty string, fake bool, socketCan string) func(http.ResponseWriter, *http.Request) {
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

		handleMessages(b, conn, tty, fake, socketCan)
	}
}
