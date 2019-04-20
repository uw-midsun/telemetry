package rest

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/binary"
	"fmt"
	"net/http"
	"net/http/httputil"
	"strings"

	log "github.com/golang/glog"
	_ "github.com/mattn/go-sqlite3" // DB impl
	"github.com/mrVanboy/go-simple-cobs"

	"telemetry/pkg/msgs"
	"telemetry/pkg/pubsub"
)

const canRxHeader = 0x585243

type canPacket struct {
	Header uint32
	ID     uint32
	Data   uint64
}

func validateAuthHeader(authHeader string, db *sql.DB) bool {
	authTokenSlice := strings.Split(authHeader, "Bearer ")
	if len(authTokenSlice) != 2 {
		return false
	}
	authToken := authTokenSlice[1]
	hashedToken := sha256.Sum256([]byte(authToken))
	hashedTokenHex := fmt.Sprintf("%x", hashedToken)

	authQuery := `SELECT * FROM auth WHERE token = ? LIMIT 1;`
	rows, err := db.Query(authQuery, hashedTokenHex)
	defer rows.Close()

	if err != nil {
		return false
	}

	if rows.Next() {
		return true
	}

	return false
}

// ServeHTTPCurrentStream listens to a stream of data and dumps it into the bus
func ServeHTTPCurrentStream(b *pubsub.MessageBus, db *sql.DB) func(http.ResponseWriter, *http.Request) {

	// Create authentication DB
	createOAuthTbl := `
			CREATE TABLE IF NOT EXISTS
				auth (token TEXT);`

	_, err := db.Exec(createOAuthTbl)
	if err != nil {
		log.Errorf("Failed to create OAuth table " + err.Error())
	}

	return func(w http.ResponseWriter, r *http.Request) {

		authTokenContent := r.Header.Get("Authorization")
		if !validateAuthHeader(authTokenContent, db) {
			http.Error(w, "Authorization required", http.StatusUnauthorized)
			return
		}

		reqB, _ := httputil.DumpRequest(r, false)
		log.Infof("%s", string(reqB))

		chunkReader := bufio.NewReader(r.Body)
		for {
			chunk, err := chunkReader.ReadBytes(0x00)
			if err != nil {
				log.Infof("Failed to read chunk %s", err.Error())
				break
			}
			decoded, err := cobs.Decode(chunk[:len(chunk)-1])
			if err != nil {
				log.Errorf("Error: cobs failed to decode", err)
				continue
			}

			packet := canPacket{}
			binary.Read(bytes.NewBuffer(decoded), binary.LittleEndian, &packet)
			hdr := packet.Header & 0xFFFFFF
			dlc := uint8((packet.Header >> 28) & 0xF)
			if hdr == canRxHeader {
				b.Publish("CAN", msgs.NewCAN(packet.ID, packet.Data, dlc))
			}
		}
	}
}
