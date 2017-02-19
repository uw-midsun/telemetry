# telemetry
Telemetry server for a solar car

## Getting Started
Get the code

```bash
go get -d github.com/uw-midsun/telemetry
cd $GOPATH/src/github.com/uw-midsun/telemetry
```

We use [Glide](https://github.com/Masterminds/glide) to manage vendored dependencies.

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

```bash
make test-coverage
```

### Linting

```bash
make lint
```

To lint a specific package

```bash
make lint PKG=telemetry/package
```
