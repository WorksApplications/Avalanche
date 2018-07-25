

all: services

services: collect  detect

collect:

: -img

-img: /Dockerfile /src/scripting-server.py
	docker build -f /Dockerfile --tag :latest 

detect: detect-img

detect-img: detect-bin image/detect/Dockerfile
	docker build --no-cache -f image/detect/Dockerfile --tag detect:latest .

detect-bin: cmd/detect/app.go
	go build -o bin/detect cmd/detect/app.go

