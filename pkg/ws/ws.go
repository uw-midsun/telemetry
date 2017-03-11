package ws

import (
	"net/http"
	"time"

	"github.com/gorilla/websocket"

	"telemetry/pkg/sources/fake"
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
func handleMessages(conn *websocket.Conn) {
	// pingTicker := time.NewTicker(pingPeriod)
	// defer pingTicker.Stop()

	for {
		// TODO: actually parse received messages for bidirectional data exchange
		// msgType, message, err := conn.ReadMessage()

		fake.GenFake(conn)
	}
}

// ServeHTTP serves the websocket connection
func ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	defer func() {
		if conn != nil {
			conn.Close()
		}
	}()

	if err != nil {
		return
	}

	handleMessages(conn)
}
