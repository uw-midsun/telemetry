module github.com/uw-midsun/telemetry

go 1.12

require (
	github.com/BurntSushi/toml v0.3.1 // indirect
	github.com/go-chi/chi v0.0.0-20170216185340-5917107c1cec // indirect
	github.com/golang/glog v0.0.0-20160126235308-23def4e6c14b
	github.com/golang/protobuf v1.3.1 // indirect
	github.com/gorilla/websocket v0.0.0-20170218162710-3f3e394da2b8 // indirect
	github.com/inconshreveable/mousetrap v1.0.0 // indirect
	github.com/jacobsa/go-serial v0.0.0-20180131005756-15cf729a72d4 // indirect
	github.com/linklayer/go-socketcan v0.0.0-20190403144728-e9fc2da5204c
	github.com/mattn/go-sqlite3 v1.10.0 // indirect
	github.com/mrVanboy/go-simple-cobs v0.0.0-20180102074149-bc19984395e8 // indirect
	github.com/pkg/errors v0.0.0-20161029093637-248dadf4e906 // indirect
	github.com/spf13/cobra v0.0.0-20170217164507-ee4055870c2d // indirect
	github.com/spf13/viper v1.3.2 // indirect
	github.com/uw-midsun/telemetry/pkg/canmsgdefs v0.0.0 // indirect
	github.com/uw-midsun/telemetry/pkg/cli v0.0.0
	github.com/uw-midsun/telemetry/pkg/db v0.0.0 // indirect
	github.com/uw-midsun/telemetry/pkg/msgs v0.0.0
	github.com/uw-midsun/telemetry/pkg/protos v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/pubsub v0.0.0-00010101000000-000000000000
	github.com/uw-midsun/telemetry/pkg/rest v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/sources/fake v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/sources/serial v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/util/randutil v0.0.0-00010101000000-000000000000
	github.com/uw-midsun/telemetry/pkg/ws v0.0.0-00010101000000-000000000000 // indirect
	golang.org/x/net v0.0.0-20190522155817-f3200d17e092 // indirect
	golang.org/x/sync v0.0.0-20190412183630-56d357773e84 // indirect
)

replace github.com/uw-midsun/telemetry/pkg/cli => ./pkg/cli

replace github.com/uw-midsun/telemetry/pkg/db => ./pkg/db

replace github.com/uw-midsun/telemetry/pkg/msgs => ./pkg/msgs

replace github.com/uw-midsun/telemetry/pkg/canmsgdefs => ./pkg/canmsgdefs

replace github.com/uw-midsun/telemetry/pkg/protos => ./pkg/protos

replace github.com/uw-midsun/telemetry/pkg/pubsub => ./pkg/pubsub

replace github.com/uw-midsun/telemetry/pkg/sources/fake => ./pkg/sources/fake

replace github.com/uw-midsun/telemetry/pkg/sources/serial => ./pkg/sources/serial

replace github.com/uw-midsun/telemetry/pkg/util/randutil => ./pkg/util/randutil

replace github.com/uw-midsun/telemetry/pkg/ws => ./pkg/ws

replace github.com/uw-midsun/telemetry/pkg/rest => ./pkg/rest
