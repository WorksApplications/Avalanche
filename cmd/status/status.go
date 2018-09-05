package main

import (
	"log"
	"net/http"
	"time"
)

type status int

const (
	OK status = iota
	Err
	DBErr
	Slow
	SchedNoAvail
)

type service struct {
	url    string
	health status
	seen   time.Time

	lasttime_healthy time.Time
	internal_address string
}

type services map[string]service

func poll(ss []string) service {
	t := time.Now()
	for _, s := range ss {
		r, err := http.Get(s)
	}
}

func initService(s string) service {
}

func main() {
}
