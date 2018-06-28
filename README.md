# telemetry

[![Build Status](https://travis-ci.org/uw-midsun/telemetry.svg?branch=master)](https://travis-ci.org/uw-midsun/telemetry)

This repository contains the latest version of the
[University of Waterloo](https://uwaterloo.ca/)'s
[Midnight Sun Solar Rayce Car](http://www.uwmidsun.com/) team's telemetry
software for our solar car. This backend is also shared with the driver
dashboard display.

The telemetry server is written in Golang, and receives data from the telemetry
board mounted in the vehicle. It exposes a WebSocket connection to stream
messages as they arrive, and provides a RESTful API for exploring historical
data. A SQLite database (optional) is used to store the received data for future
use.

## telemetry-client
The telemetry client is a web frontend that displays data pushed from the server
over a WebSocket connection. This is written in TypeScript.

### Getting Started
We use [yarn](https://yarnpkg.com/en/) to manage dependencies&mdash;it is 
compatible with `npm`, but is a little faster and allows us to specify a
`yarn.lock` file.

```bash
yarn install
```

## telemetry-server

### Getting Started
We use [Glide](https://github.com/Masterminds/glide) to manage vendored
dependencies.

Once you've installed Glide, get the code

```bash
go get -d github.com/uw-midsun/telemetry
cd $GOPATH/src/github.com/uw-midsun/telemetry
make
```

### Makefile commands
If you're stuck and need help

```bash
make help
```

#### Building the binary
To build the binary (output in ``bin/``)

```bash
make
```

Release binaries are automatically compiled on each merge into master. Releases
are supplied for x86 and arm32 (armeabi-v5) Linux.

To compile on other platforms follow the same install instructions. If you get
errors you may need the following flags:

*macOS*

Requires macOS header files and GCC

```bash
env GOOS=darwin GOARCH=<386 or arm64> CGO_ENABLED=1 make
```

*Windows*

Requires Windows GCC toolchain

```bash
env GOOS=windows GOARCH=<386 or arm64> CGO_ENABLED=1 make
```

#### Tests
To build (and run) the tests

```bash
make test
```

You can also run tests with specific arguments

```bash
make test ARGS="-v"
```

Or run the tests for a specific package

```bash
make test PKG=telemetry/cmd
```

To run the tests in verbose mode

```bash
make test-verbose
```

Or with the race-detector enabled

```bash
make test-race
```

To have the test output in XML

```bash
make test-xml
```

If you want coverage results

```bash
make test-coverage
```

#### Linting
All linting is done by `golint`

```bash
make lint
```

To lint a specific package

```bash
make lint PKG=telemetry/package-name
```

## Updating

For the driver display system we use a Raspberry Pi computer to run the server.
To update it follow these instructions:

```bash
cd /home/pi/telemetry
rm -rf .
```

Download the release `arm32_linux.zip` from the releases page. Unzip the
contents of the zipfile in `/home/pi/telemetry`. The PI is configured to
autostart the rest.

## License
The project is made available under the [MIT License](https://opensource.org/licenses/MIT).
