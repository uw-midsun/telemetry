PACKAGE  = telemetry
DATE    ?= $(shell date +%FT%T%z)
VERSION ?= $(shell git describe --tags --always --dirty --match=v* 2> /dev/null || \
			cat $(CURDIR)/.version 2> /dev/null || echo v0)
GOPATH   := ${PWD}/.gopath~
GOBIN    := $(GOPATH)/bin
BASE     := $(GOPATH)/src/$(PACKAGE)

# use user-given PKG variable
# otherwise do `go list ./...`, but ignore files in vendor/ directory
# TODO: check if this is portable enough, otherwise we might need to rewrite this logic
PKGS     = $(or $(PKG),$(shell $(GO) list -m -f "{{ .Path }}" all | grep "uw-midsun"))
TESTPKGS = $(shell $(GO) list -f '{{ if .TestGoFiles }}{{ .ImportPath }}{{ end }}' $(PKGS))

GO       = go
GODOC    = godoc
GOFMT    = gofmt
TIMEOUT  = 15
V := 0
Q := $(if $(filter 1,$V),,@)

.PHONY: all
all: fmt lint vendor | $(BASE) ; $(info building executable...) @ ## Build program binary
	$Q $(GO) build \
		-tags release \
		-ldflags '-X $(PACKAGE)/cmd.Version=$(VERSION) -X $(PACKAGE)/cmd.BuildDate=$(DATE)' \
		-o bin/$(PACKAGE) main.go

# echoing $GOPATH to ensure it is evaluated and not lazily-evaluated
$(BASE): ; $(info setting $$GOPATH...)
	@mkdir -p $(dir $@)
	@ln -sf $(CURDIR) $@


#########
# Tools #
#########
GOLINT = $(GOBIN)/golint
$(GOBIN)/golint: | $(BASE) ; $(info building golint...)
	$Q go get golang.org/x/lint/golint

GOCOVMERGE = $(GOBIN)/gocovmerge
$(GOBIN)/gocovmerge: | $(BASE) ; $(info building gocovmerge...)
	$Q go get github.com/wadey/gocovmerge

GOCOV = $(GOBIN)/gocov
$(GOBIN)/gocov: | $(BASE) ; $(info building gocov...) @ ## Hack: https://github.com/golang/go/issues/27215#issuecomment-451342769
	$Q go get github.com/axw/gocov
	$Q go get github.com/axw/gocov/...

GOCOVXML = $(GOBIN)/gocov-xml
$(GOBIN)/gocov-xml: | $(BASE) ; $(info building gocov-xml...)
	$Q go get github.com/AlekSi/gocov-xml

GO2XUNIT = $(GOBIN)/go2xunit
$(GOBIN)/go2xunit: | $(BASE) ; $(info building go2xunit...)
	$Q go get github.com/tebeka/go2xunit


#########
# Tests #
#########
TEST_TARGETS := test-default test-bench test-short test-verbose test-race
.PHONY: $(TEST_TARGETS) test-xml check test tests

# Run benchmarks
test-bench:   ARGS=-run=__absolutelynothing__ -bench=.

# Run only short tests
test-short:   ARGS=-short

# Run tests in verbose mode with coverage reporting
test-verbose: ARGS=-v

# Run tests with race detector
test-race:    ARGS=-race

$(TEST_TARGETS): NAME=$(MAKECMDGOALS:test-%=%)
$(TEST_TARGETS): test
check test tests: fmt lint vendor | $(BASE) ; $(info running $(NAME:%=% )tests...) @ ## Run tests
	$Q cd $(BASE) && $(GO) test -timeout $(TIMEOUT)s $(ARGS) $(TESTPKGS)

test-xml: fmt lint vendor | $(BASE) $(GO2XUNIT) ; $(info running $(NAME:%=% )tests...) @ ## Run tests with xUnit output
	$Q cd $(BASE) && 2>&1 $(GO) test -timeout 20s -v $(TESTPKGS) | tee test/tests.output
	$(GO2XUNIT) -fail -input test/tests.output -output test/tests.xml

# Code coverage
COVERAGE_MODE = atomic
COVERAGE_PROFILE = $(COVERAGE_DIR)/profile.out
COVERAGE_XML = $(COVERAGE_DIR)/coverage.xml
COVERAGE_HTML = $(COVERAGE_DIR)/index.html
.PHONY: test-coverage test-coverage-tools
test-coverage-tools: | $(GOCOVMERGE) $(GOCOV) $(GOCOVXML)
test-coverage: COVERAGE_DIR := $(CURDIR)/test/coverage.$(shell date +%F_%H-%M-%S)
test-coverage: fmt lint vendor test-coverage-tools | $(BASE) ; $(info running coverage tests...) @ ## Run coverage tests
	$Q mkdir -p $(COVERAGE_DIR)/coverage
	$Q for pkg in $(TESTPKGS); do \
		$(GO) test \
			-coverpkg=$$($(GO) list -f '{{ join .Deps "\n" }}' $$pkg | \
					grep '$(PACKAGE)/' | grep -v '$(PACKAGE)/vendor/' | \
					tr '\n' ',')$$pkg \
			-covermode=$(COVERAGE_MODE) \
			-coverprofile="$(COVERAGE_DIR)/coverage/`echo $$pkg | tr "/" "-"`.cover" $$pkg || exit 1; \
	 done
	$Q $(GOCOVMERGE) $(COVERAGE_DIR)/coverage/*.cover > $(COVERAGE_PROFILE)
	$Q $(GO) tool cover -html=$(COVERAGE_PROFILE) -o $(COVERAGE_HTML)
	$Q $(GOCOV) convert $(COVERAGE_PROFILE) | $(GOCOVXML) > $(COVERAGE_XML)

.PHONY: lint
lint: vendor | $(BASE) $(GOLINT) ; $(info running golint...) @ ## Run golint
	$Q ret=0 && for pkg in $(PKGS); do \
		test -z "$$($(GOLINT) $$pkg | tee /dev/stderr)" || ret=1 ; \
	 done ; exit $$ret

.PHONY: fmt
fmt: ; $(info running gofmt...) @ ## Run gofmt on all source files
	@ret=0 && for d in $$($(GO) list -f '{{.Dir}}' ./... | grep -v /vendor/); do \
		$(GOFMT) -l -w $$d/*.go || ret=$$? ; \
	 done ; exit $$ret

#########################
# Dependency management #
#########################
vendor: | $(BASE) ; $(info retrieving dependencies...)
	$(GO) mod vendor


#################
# Miscellaneous #
#################
.PHONY: clean
clean: ; $(info cleaning...)	@ ## Cleanup everything
	@rm -rf $(GOPATH)
	@rm -rf bin
	@rm -rf test/tests.* test/coverage.*
	@rm -rf vendor

.PHONY: help
help:
	@grep -E '^[ a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: version
version:
	@echo $(VERSION)
