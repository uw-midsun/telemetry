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
	pingPeriod = 5 * time.Second
	// Maximum time to wait when trying to send a message to the client.
	writeWait = 60 * time.Second
	// Whether we should forcibly close websockets if a client is not
	// replying to pings
	disconnectOnPingTimeout = true
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
	defer log.Infof("Closing WS connection")

	// A ticker to send pings
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	// A channel to break out of the blocking select below
	errChannel := make(chan error)

	// the websocket cannot be concurrently written to
	l := sync.Mutex{}

	callback := func(msg msgs.CAN) {
		l.Lock()
		err := conn.WriteJSON(msg)
		l.Unlock()
		errChannel <- err
	}

	bus.Subscribe("CAN", callback)
	defer bus.Unsubscribe("CAN", callback)

  // This block reads from the websocket. Reading from the websocket is necessary
	// if we want to process ping/pong and close messages that the client sends.
	go func () {
		for {
				if _, _, err := conn.ReadMessage(); err != nil {
					log.Errorf("WS NextReader caught error, exiting: " + err.Error())
					conn.Close()
					errChannel <- err
				}
		}
	} ()

	for {
		select {
		case <- ticker.C:

			l.Lock()
			err := conn.WriteMessage(websocket.PingMessage, nil)
			l.Unlock()

			if err != nil {
				log.Errorf("WS write caught error, exiting: " + err.Error())
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

		// This block will set a timeout on the socket. If the ws does not reply to pongs, then
		// the timeout expires. When the ws replies to pongs, the timeout is delayed.
		if disconnectOnPingTimeout {
			err = conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err != nil {
				log.Infof("Got an error while setting write deadline on WS: %s", err.Error())
			}

			conn.SetPongHandler(func(_ string) error {
				err := conn.SetWriteDeadline(time.Now().Add(writeWait))
				if err != nil {
					log.Infof("Got an error while setting write deadline on WS: %s", err.Error())
				}
				return err
			})
		}

		handleMessages(b, conn)
	}
}
