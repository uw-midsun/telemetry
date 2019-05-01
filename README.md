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
These steps must be followed **after** setting up telemetry-server.

We use [yarn](https://yarnpkg.com/en/) to manage dependencies&mdash;it is 
compatible with `npm`, but is a little faster and allows us to specify a
`yarn.lock` file.

```bash
cd $GOPATH/src/github.com/uw-midsun/telemetry/client
yarn install
```

We use TypeScript extensively, so you will need to compile the TypeScript files. First, install TypeScript, then compile the code with our `tsconfig.json` configuration.

```bash
cd $GOPATH/src/github.com/uw-midsun/telemetry/client
tsc
```

For some stylesheets, we use Sass, so you will need to install that as well. Then, compile the Sass stylesheets to CSS.

```bash
cd $GOPATH/src/github.com/uw-midsun/telemetry/client/src/css
sass stylesheet.scss stylesheet.css
```

To start serving the webpage, run the server executable with appropriate options specified. The driver display webpage will be accessible at <IP_ADDRESS>:8080/driver_display.html.

```bash
cd $GOPATH/src/github.com/uw-midsun/telemetry
./bin/telemetry start -f --schema=can_messages.asciipb
```

## telemetry-server

### Getting Started
We use Go to write backend code for the telemetry server. Follow the appropriate instructions to install Go for your operating system, then check that environment variables are set up correctly by running `go env`.

If you are using the Midnight Sun Box, it may be desirable to have the files in the `shared` directory, so that you can edit files using an editor on your local machine rather than vi in the Box. This can be accomplished by creating a directory in the shared directory, and setting the GOPATH to that directory.

```bash
cd ~/shared && mkdir go
export GOPATH=$HOME/shared/go
```

If you haven't changed the shell, you will also need to edit the GOPATH in your Bash profile. In `~/.bashrc`, locate the line near the bottom of the file that starts with `export GOPATH=`, and modify the line to say `export GOPATH=/home/vagrant/shared/go`.

Once you've set up the GOPATH variable, get and compile the code. Please note that since we're using [go modules](https://github.com/golang/go/wiki/Modules) for dependency management, the telemetry repository should not be located under GOPATH.

```bash
cd ~/shared
git clone https://github.com/uw-midsun/telemetry.git
cd telemetry
make
```

On Windows, you may run into an error about failing to create symbolic links. Make sure that you are running your terminal application (Cygwin, Git Bash, etc.) with administrator privileges!

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

Download the release `arm32_linux.zip` from the
[releases](https://github.com/uw-midsun/telemetry/releases) page. Unzip the
contents of the zipfile in `/home/pi/telemetry`. The PI is configured to
autostart the server and client.

## License
The project is made available under the [MIT License](https://opensource.org/licenses/MIT).
