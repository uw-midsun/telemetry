package rest

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httputil"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
)

// ServeHTTP listens to a stream of data and dumps it into the bus
func ServeHTTP(b *pubsub.MessageBus, db *sql.DB) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		if !ValidateAuthHeader(r.Header, db) {
			http.Error(w, "Authorization required", http.StatusUnauthorized)
			return
		}

		reqB, _ := httputil.DumpRequest(r, false)
		log.Infof("%s", string(reqB))

		chunkReader := json.NewDecoder(r.Body)
		var canPacket msgs.CAN
		for {
			err := chunkReader.Decode(&canPacket)
			if err != nil {
				if err == io.EOF {
					break
				}
				log.Errorf("Error: failed to read json " + err.Error())
				continue
			}
			b.Publish("CAN", canPacket)
		}
	}
}
