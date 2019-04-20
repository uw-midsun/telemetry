package main

import (
	"flag"
	"github.com/uw-midsun/telemetry/pkg/cli"
)

func main() {
	flag.CommandLine.Parse([]string{"-alsologtostderr=true"})
	cli.Main()
}
