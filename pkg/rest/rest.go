package rest

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httputil"
	"time"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
)

// JSONStreamEndpoint is the endpoint to hit in order to send another telemetry server CAN data
var JSONStreamEndpoint = "/can/stream/json"

// ServeHTTP listens to a stream of data and dumps it into the bus
func ServeHTTP(b *pubsub.MessageBus, db *sql.DB) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		if !ValidateAuthHeader(r.Header, db) {
			http.Error(w, "Authorization required", http.StatusUnauthorized)
			return
		}

		w.WriteHeader(http.StatusOK)

		reqB, _ := httputil.DumpRequest(r, false)
		log.Infof("%s", string(reqB))

		chunkReader := json.NewDecoder(r.Body)
		var canPacket msgs.CAN
		for {
			// https://github.com/golang/go/wiki/Timeouts
			//
			// This channel and the following select are used to implement a custom
			// timeout.
			c := make(chan error, 1)
			go func() { c <- chunkReader.Decode(&canPacket) } ()
			select {
				case <-time.After(15 * time.Second):
					log.Errorf("Timeout!")
					return
				case err := <-c:
					if err != nil {
						if err == io.EOF {
							break
						}
						log.Errorf("Error: failed to read json " + err.Error())
						return
					}
					b.Publish("CAN", canPacket)
			}
		}
	}
}
