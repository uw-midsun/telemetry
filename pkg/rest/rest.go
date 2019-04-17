package ws

import (
	"database/sql"
	"net/http"
	"time"

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
func ServeHTTPCurrentStream(b *pubsub.MessageBus, db *DB) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		authTokenContent := r.Header.Get("Authorization")
		authTokenSlice := strings.Split(authTokenContent, "Bearer")
		authToken := authTokenSlice[1]

		authQuery := `SELECT TOP 1 1 FROM auth WHERE token = ?;`

		rows, err = db.Query(authQuery, authToken)
		defer rows.Close()

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !rows.Next() {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// It looks like we're authenticated

		partReader := multipart.NewReader(r.Body, "eh")
		buf := make([]byte, 256)
		for {
			part, err := partReader.NextPart()
			if err == io.EOF {
				break
			}
			var n int
			for {
				n, err = part.Read(buf)
				if err == io.EOF {
					break
				}
				fmt.Printf(string(buf[:n]))
			}
			fmt.Printf(string(buf[:n]))
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
