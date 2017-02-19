# telemetry

[![Build Status](https://travis-ci.org/uw-midsun/telemetry.svg?branch=master)](https://travis-ci.org/uw-midsun/telemetry)

This repository contains the latest version of the [University of Waterloo](https://uwaterloo.ca/)'s [Midnight Sun Solar Rayce Car](http://www.uwmidsun.com/) team's telemetry server for a solar car.

## Getting Started
We use [Glide](https://github.com/Masterminds/glide) to manage vendored dependencies.

Once you've installed Glide, get the code

```bash
go get -d github.com/uw-midsun/telemetry
cd $GOPATH/src/github.com/uw-midsun/telemetry
make
```

## Makefile commands

```bash
make help
```

### Building the binary
To build the binary (in ``bin/``)

```bash
make
```

### Tests

```bash
make test
```

You can also run tests with specific arguments

```bash
make test ARGS="-v"
```

Or run tests for a specific package

```bash
make test PKG=telemetry/cmd
```

To run the test in verbose mode

```bash
make test-verbose
```

Or with the race-detector enabled

```bash
make test-race
```

```bash
make test-xml
```

If you want coverage results

```bash
make test-coverage
```

### Linting

```bash
make lint
```

To lint a specific package

```bash
make lint PKG=telemetry/package-name
```

## License
The project is made available under the [MIT License](https://opensource.org/licenses/MIT).
