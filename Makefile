UTIL = $(shell find pkg/util -name *.go)
MODEL = $(shell find pkg/model -name *.go)

all: bin

images: collect  detect
bin: collect-bin detect-bin

collect: collect-img

collect-img: collect-bin
	docker build -f image/collect/Dockerfile --tag collect:latest .

collect-bin: $(shell find cmd/collect -name *.go) $(UTIL) $(MODEL) swagger-gen
	go build -o bin/collect cmd/collect/app.go

swagger-gen: swagger

swagger: api/collect.yml
	swagger generate server -f api/collect.yml -t generated_files

: -img

-img: image//Dockerfile /src/scripting-server.py
	docker build -f image//Dockerfile --tag :latest 

detect: detect-img

detect-img: detect-bin image/detect/Dockerfile
	docker build --no-cache -f image/detect/Dockerfile --tag detect:latest .

detect-bin: $(shell find cmd/detect -name *.go) $(UTIL) $(MODEL)
	go build -o bin/detect cmd/detect/app.go

