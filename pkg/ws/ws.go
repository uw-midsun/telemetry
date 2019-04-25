package ws

import (
	"net/http"
	"time"

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"

	log "github.com/golang/glog"

	"sync"

	"github.com/gorilla/websocket"
)

const (
	// Time between pinging for presence.
	pingPeriod = 30 * time.Second
	// Maximum time to wait when trying to send a message to the client.
	writeWait = 60 * time.Second
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
	// A ticker to send pings
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	// A channel to break out of the blocking select below
	errChannel := make(chan error)

	// the websocket cannot be concurrently written to
	l := sync.Mutex{}

	callback := func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		err := conn.WriteJSON(msg)
		errChannel <- err
	}

	bus.Subscribe("CAN", callback)
	defer bus.Unsubscribe("CAN", callback)

	for {
		select {
		case <- ticker.C:
			err := conn.WriteMessage(websocket.PingMessage, nil);
			if err != nil {
				return
			}
		case err := <- errChannel:
			if err != nil {
				log.Errorf("WS caught error, exiting: " + err.Error())
				return
			}
		}
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

		err = conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err != nil {
			log.Infof("Got an error while setting write deadline on WS: %s", err.Error())
		}

		conn.SetPongHandler(func(_ string) error {
			err := conn.SetWriteDeadline(time.Now().Add(writeWait))
			return err
		})

		handleMessages(b, conn)
	}
}
