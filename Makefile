UTIL = $(shell find pkg/util -name *.go)
MODEL = $(shell find pkg/model -name *.go)

all: bin

images: collect  detect
bin: bin/*

collect: collect-img

collect-img: bin/collect
	docker build -f image/collect/Dockerfile --tag collect:latest .

bin/collect: $(shell find cmd/collect -name *.go) $(UTIL) $(MODEL) generated_files
	go build -o bin/collect cmd/collect/server.go

generated_files: api/collect.yml
	swagger generate server -f api/collect.yml -t generated_files -A collect

: -img

-img: image//Dockerfile /src/scripting-server.py
	docker build -f image//Dockerfile --tag :latest 

detect: detect-img

detect-img: bin/detect image/detect/Dockerfile
	docker build --no-cache -f image/detect/Dockerfile --tag detect:latest .

bin/detect: $(shell find cmd/detect -name *.go) $(UTIL) $(MODEL)
	go build -o bin/detect cmd/detect/app.go

