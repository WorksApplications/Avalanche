PKG = $(shell find pkg -name *.go)


.PHONY: default clean fmt make_stub dep swagger backend front test openapi-client-gen

default: all

all: front backend

backend: bin/scanner bin/collect bin/kube-client bin/blame

cli: bin/converter bin/extract

front: front/public/app.js

collect: collect-img

bin/kube-client: $(shell find cmd/kube-client -name *.go) $(PKG)
	CGO_ENABLED=0 go build -o bin/kube-client cmd/kube-client/*.go

bin/converter: $(shell find cmd/convert -name *.go) $(PKG)
	CGO_ENABLED=0 go build -o bin/converter cmd/convert/*.go

bin/blame: $(shell find cmd/blame -name *.go) $(PKG)
	CGO_ENABLED=0 go build -o bin/blame cmd/blame/*.go

bin/collect: $(shell find cmd/collect -name *.go) $(PKG) generated_files/stub
	CGO_ENABLED=0 go build -o bin/collect cmd/collect/*.go

bin/scanner: $(shell find cmd/scanner -name *.go) $(PKG)
	CGO_ENABLED=0 go build -o bin/scanner cmd/scanner/*.go

bin/extract: $(shell find cmd/extract -name *.go) $(PKG)
	CGO_ENABLED=0 go build -o bin/extract cmd/extract/*.go

swagger:
	swagger generate server -f api/collect.yml -t generated_files -A collect

generated_files/stub: api/collect.yml
	swagger generate server -f api/collect.yml -t generated_files -A collect
	touch generated_files/stub

openapi-client-gen:
	java -jar ./openapi-generator-cli.jar generate -i ./api/collect.yml -g typescript-fetch -o ./front/src/generated/collect -D modelPropertyNaming=original
	java -jar ./openapi-generator-cli.jar generate -i ./api/blame.yml -g typescript-fetch -o ./front/src/generated/blame -D modelPropertyNaming=original

openapi-mock-gen:
	java -jar ./openapi-generator-cli.jar generate -i ./api/collect.yml -g nodejs-server -o ./front/mock/collect
	java -jar ./openapi-generator-cli.jar generate -i ./api/blame.yml -g nodejs-server -o ./front/mock/blame

front/public/app.js:
	cd front && yarn build

make_stub:
	@echo This directory is intended to be kept empty and reserved for data generated by build tools > generated_files/stub

clean:
	\rm -r front/public/; rm -r bin/; rm -r generated_files/cmd; rm -r generated_files/models; rm -r generated_files/restapi; rm generated_files/stub

fmt:	
	go fmt ./cmd/...
	go fmt ./pkg/...

test:
	go test ./cmd/...
	go test ./pkg/...

dep:
	go get -t -v -d ./...
