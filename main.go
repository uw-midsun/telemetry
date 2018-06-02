package main

import (
	"flag"
	"telemetry/pkg/cli"
)

func main() {
	flag.CommandLine.Parse([]string{"-alsologtostderr=true"})
	cli.Main()
}
