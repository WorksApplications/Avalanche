PKG = $(shell find pkg -name *.go)


.PHONY: default clean fmt make_stub dep swagger backend front

default: bin

all: bin

images: collect  detect static-nginx
bin: bin/detect bin/collect front/public/app.js
backend: bin/detect bin/collect
front: front/public/app.js

collect: collect-img

bin/collect: $(shell find cmd/collect -name *.go) $(PKG) generated_files/stub
	CGO_ENABLED=0 go build -o bin/collect cmd/collect/server.go

#bin/status: $(shell find cmd/status -name *.go) $(PKG) generated_files/stub
#	CGO_ENABLED=0 go build -o bin/status cmd/status/status.go

swagger:
	swagger generate server -f api/collect.yml -t generated_files -A collect

generated_files/stub: api/collect.yml
	swagger generate server -f api/collect.yml -t generated_files -A collect
	touch generated_files/stub

swagger-client-gen:
	java -jar ./swagger-codegen-cli.jar generate -i ./api/collect.yml -l typescript-fetch -o ./front/src/generated/collect

swagger-mock-gen:
	java -jar ./swagger-codegen-cli.jar generate -i ./api/collect.yml -l nodejs-server -o ./front/mock/collect

: -img

detect: detect-img

front/public/app.js:
	cd front && yarn build

make_stub:
	@echo This directory is intended to be kept empty and reserved for data generated by build tools > generated_files/stub

clean:
	\rm -r front/public/; rm -r bin/; rm -r generated_files/cmd; rm -r generated_files/models; rm -r generated_files/restapi; rm generated_files/stub

bin/detect: $(shell find cmd/detect -name *.go) $(PKG)
	CGO_ENABLED=0 go build -o bin/detect cmd/detect/app.go

fmt:	
	go fmt ./cmd/...
	go fmt ./pkg/...

dep:
	go get -v -d ./...
