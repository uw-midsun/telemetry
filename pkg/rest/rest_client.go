package rest

import (
	"io"
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"sync"
	"time"

	log "github.com/golang/glog"
	"github.com/spf13/viper"

	"github.com/uw-midsun/telemetry/pkg/msgs"
	"github.com/uw-midsun/telemetry/pkg/pubsub"
)

func setupClient(client *http.Client, bodyPipe *io.PipeReader) {
	req, err := http.NewRequest("POST", viper.GetString("remoteurl") + JSONStreamEndpoint, bodyPipe)
	if err != nil {
		panic(err)
	}
	req.Header.Set("Authorization", "Bearer " + viper.GetString("token"))

	go func () {
		res, err := client.Do(req)
		if err != nil {
			log.Errorf("Error: failed send request " + err.Error())
			return
		}
		response, err := httputil.DumpResponse(res, true)
		if err != nil {
			log.Errorf("Error: failed dump " + err.Error())
			return
		}
		log.Infof(string(response))
	} ()
}

// RunClient pushes can packets as json to another telemetry server
func RunClient(bus *pubsub.MessageBus) {
	log.Infof("Starting http client")
	client := &http.Client{
		Timeout:   15 * time.Minute,
	}

	bodyPipe, jsonPipe := io.Pipe()
	jsonEncoder := json.NewEncoder(jsonPipe)

	setupClient(client, bodyPipe)

	l := sync.Mutex{}
	bus.Subscribe("CAN", func(msg msgs.CAN) {
		l.Lock()
		defer l.Unlock()
		err := jsonEncoder.Encode(msg)
		if err != nil {
			log.Errorf("Error: failed stream to endpoint " + err.Error())
			bodyPipe, jsonPipe = io.Pipe()
			jsonEncoder = json.NewEncoder(jsonPipe)
			time.Sleep(3 * time.Second)
			setupClient(client, bodyPipe)
		}
	})
}
