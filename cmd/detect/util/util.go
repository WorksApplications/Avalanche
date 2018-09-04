package util

import (
	"log"
	"time"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/parser"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/detect"
)

type Request int

const (
	ADD Request = iota
	DEL
	SCAN
	RUN
	DESC
	RET
)

type ScannerRequest struct {
	Req Request
	Env *string
	Ret chan<- *detect.Subscription
}

func dispatch(ich <-chan *detect.Subscription, och chan<- *detect.Subscription) {
	for s := range ich {
		log.Printf("[Dispatched worker] Start scan for %s", s.Env)
		apps, err := parser.Scan(s.Env)
		if err != nil {
			log.Printf("Error in the scan for %s", err)
		}
		log.Printf("[Dispatched worker] Scan for %s ended.", s.Env)
		s.Apps = apps
		och <- s
	}
}

func Exchange(ch chan *ScannerRequest) {
	t := time.Tick(5 * time.Minute)
	m := make(map[string]*detect.Subscription)
	empty := make([]detect.App, 0)
	isc := make(chan *detect.Subscription, 64) // XXX: May have to be extended
	osc := make(chan *detect.Subscription, 64) // XXX: May have to be extended
	go dispatch(isc, osc)
	for {
		select {
		case res := <-osc:
			m[res.Env] = res
		case <-t:
			log.Println("start batch scan")
			for _, s := range m {
				log.Printf("%+v", s)
				isc <- s
			}
		case req := <-ch:
			env := req.Env
			if env == nil && req.Req != DESC {
				log.Printf("WARN: nil exception was almost there! req.Req=%s", req.Req)
			}
			switch req.Req {
			case ADD:
				sub := detect.Subscription{*env, empty}
				m[*env] = &sub
				log.Printf("%s will be scanned", *env)
			case DEL:
				delete(m, *env)
				log.Printf("%s won't be scanned", *env)
			case SCAN:
				sub, prs := m[*env]
				if !prs {
					sub = &detect.Subscription{*env, empty}
					// If this line is enabled, you don't have to receive result from dispatch.
					// However, you will return empty list which is empty because it is not scanned yet
					// m[*env] = sub
				}
				isc <- sub
			case DESC:
				if env == nil {
					for _, sub := range m {
						req.Ret <- sub
					}
				} else {
					sub, prs := m[*env]
					if !prs {
						log.Printf("Not found %s", *env)
					} else {
						req.Ret <- sub
					}
				}
				close(req.Ret)
			}
		}
	}
}
