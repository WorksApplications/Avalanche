PKG = $(shell find pkg -name *.go)


.PHONY: default clean fmt

default: bin

pushi: images
	docker push ${
	docker push ${
	docker push ${
	docker push ${

all: bin

images: collect  detect static-nginx
bin: bin/detect bin/collect front/public

static-nginx: front/public/app.js
	docker build -f image/static/Dockerfile --tag ${

collect: collect-img

collect-img: bin/collect
	docker build -f image/collect/Dockerfile --tag ${

bin/collect: $(shell find cmd/collect -name *.go) $(PKG) generated_files/stub
	go build -o bin/collect cmd/collect/server.go

generated_files/stub: api/collect.yml
	swagger generate server -f api/collect.yml -t generated_files -A collect
	touch generated_files/stub

: -img

-img: image//Dockerfile /src/scripting-server.py
	docker build -f image//Dockerfile --tag ${

detect: detect-img

detect-img: bin/detect image/detect/Dockerfile
	docker build --no-cache -f image/detect/Dockerfile --tag ${

front/public/app.js:
	cd front && yarn build

clean:
	\rm -r front/public/; rm -r bin/; rm -r generated_files/cmd; rm -r generated_files/models; rm -r generated_files/restapi
bin/detect: $(shell find cmd/detect -name *.go) $(PKG)
	go build -o bin/detect cmd/detect/app.go

fmt:	
	go fmt ./cmd/...
	go fmt ./pkg/...
