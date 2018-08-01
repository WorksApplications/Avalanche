MODEL = $(shell find pkg/model -name *.go)

.PHONY:fmt

all: bin

images: collect  detect
bin: bin/*

collect: collect-img

collect-img: bin/collect
	docker build -f image/collect/Dockerfile --tag collect:latest .

bin/collect: $(shell find cmd/collect -name *.go) $(MODEL) generated_files/stub
	go build -o bin/collect cmd/collect/server.go

generated_files/stub: api/collect.yml
	swagger generate server -f api/collect.yml -t generated_files -A collect
	touch generated_files/stub

: -img

-img: image//Dockerfile /src/scripting-server.py
	docker build -f image//Dockerfile --tag :latest 

detect: detect-img

detect-img: bin/detect image/detect/Dockerfile
	docker build --no-cache -f image/detect/Dockerfile --tag detect:latest .

bin/detect: $(shell find cmd/detect -name *.go) $(MODEL)
	go build -o bin/detect cmd/detect/app.go

fmt:	
	go fmt ./cmd/...
	go fmt ./pkg/...
