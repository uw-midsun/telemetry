module github.com/uw-midsun/telemetry

go 1.12

require (
	github.com/AlekSi/gocov-xml v0.0.0-20190121064608-3a14fb1c4737 // indirect
	github.com/axw/gocov v0.0.0-20170322000131-3a69a0d2a4ef // indirect
	github.com/go-chi/chi v0.0.0-20170216185340-5917107c1cec // indirect
	github.com/golang/glog v0.0.0-20160126235308-23def4e6c14b
	github.com/golang/protobuf v0.0.0-20180612185929-5831880292e7 // indirect
	github.com/gorilla/websocket v0.0.0-20170218162710-3f3e394da2b8 // indirect
	github.com/inconshreveable/mousetrap v1.0.0 // indirect
	github.com/jacobsa/go-serial v0.0.0-20180131005756-15cf729a72d4
	github.com/linklayer/go-socketcan v0.0.0-20190403144728-e9fc2da5204c
	github.com/mattn/go-sqlite3 v0.0.0-20170305140206-eac1dfa2a61e // indirect
	github.com/mrVanboy/go-simple-cobs v0.0.0-20180102074149-bc19984395e8
	github.com/pkg/errors v0.0.0-20161029093637-248dadf4e906 // indirect
	github.com/spf13/cobra v0.0.0-20170217164507-ee4055870c2d // indirect
	github.com/spf13/pflag v0.0.0-20160820154156-103ce5cd2042 // indirect
	github.com/uw-midsun/telemetry/pkg/canmsgdefs v0.0.0
	github.com/uw-midsun/telemetry/pkg/cli v0.0.0
	github.com/uw-midsun/telemetry/pkg/db v0.0.0 // indirect
	github.com/uw-midsun/telemetry/pkg/msgs v0.0.0
	github.com/uw-midsun/telemetry/pkg/protos v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/pubsub v0.0.0-00010101000000-000000000000
	github.com/uw-midsun/telemetry/pkg/sources/fake v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/sources/serial v0.0.0-00010101000000-000000000000 // indirect
	github.com/uw-midsun/telemetry/pkg/util/randutil v0.0.0-00010101000000-000000000000
	github.com/uw-midsun/telemetry/pkg/ws v0.0.0-00010101000000-000000000000 // indirect
	github.com/wadey/gocovmerge v0.0.0-20160331181800-b5bfa59ec0ad // indirect
	golang.org/x/lint v0.0.0-20190409202823-959b441ac422 // indirect
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
