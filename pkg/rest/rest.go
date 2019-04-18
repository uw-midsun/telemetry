package rest

import (
	"bytes"
	"database/sql"
	"encoding/binary"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"net/http/httputil"
	"strings"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

const canRxHeader = 0x585243

type canPacket struct {
	Header uint32
	ID     uint32
	Data   uint64
}

// ServeHTTPCurrentStream listens to a stream of data and dumps it into the bus
func ServeHTTPCurrentStream(b *pubsub.MessageBus, db *sql.DB) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		req, err := httputil.DumpRequest(r, true)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		log.Infof("Request:\n %s", string(req))

		authTokenContent := r.Header.Get("Authorization")
		authTokenSlice := strings.Split(authTokenContent, "Bearer ")
		if len(authTokenSlice) != 2 {
			http.Error(w, "Authorization required", http.StatusUnauthorized)
			return
		}
		authToken := authTokenSlice[1]

		authQuery := `SELECT * FROM auth WHERE token = ? LIMIT 1;`
		rows, err := db.Query(authQuery, authToken)
		defer rows.Close()

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if !rows.Next() {
			http.Error(w, "Authorization required", http.StatusUnauthorized)
			return
		}

		if r.Header.Get("Transfer-Encoding") != "chunked" {
			http.Error(w, "This is a streaming endpoint. Please stream", http.StatusUnsupportedMediaType)
			return
		}

		// It looks like we're authenticated

		partReader := multipart.NewReader(r.Body, "eh")
		for {
			part, err := partReader.NextPart()
			if err != nil {
				log.Infof("Failed to read part 1 %s", err.Error())
				break
			}
			for {
				buf, err := ioutil.ReadAll(part)
				if err != nil {
					log.Infof("Failed to read part " + err.Error())
					break
				}
				packet := canPacket{}
				binary.Read(bytes.NewBuffer(buf), binary.LittleEndian, &packet)
				hdr := packet.Header & 0xFFFFFF
				dlc := uint8((packet.Header >> 28) & 0xF)
				if hdr == canRxHeader {
					log.Infof("Published something %s")
					b.Publish("CAN", msgs.NewCAN(packet.ID, packet.Data, dlc))
				}
			}
		}
	}
}
