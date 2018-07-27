package util

import (
    "log"
    "time"

    "git.paas.workslan/resource_optimization/dynamic_analysis/cmd/detect/parser"
    "git.paas.workslan/resource_optimization/dynamic_analysis/pkg/model"
)

type Request int

const (
	ADD Request = iota
	DEL
	SCAN
	RUN
	PULL
	RET
)

type ScannerRequest struct {
	Req Request
	Sub *model.Subscription
}

func dispatch(ch chan model.Subscription) {
	for s := range ch {
        log.Printf("Start scan for %s", s.Env)
		apps, err := parser.Scan(s.Env)
		log.Printf("%s", err)
		sub := model.Subscription{s.Env, apps}
		ch <- sub
	}
}

func Exchange(ch chan *ScannerRequest) {
	t := time.Tick(1 * time.Minute)
	m := make(map[string]*model.Subscription)
	empty := make([]model.App, 0)
	sc := make(chan model.Subscription, 64) //May have to be extended
	go dispatch(sc)
	for {
		select {
		case res := <-sc:
			m[res.Env] = &res
		case <-t:
			log.Println("start batch scan")
			for _, s := range m {
				sc <- *s
			}
		case req := <-ch:
			switch req.Req {
			case ADD:
				sub := model.Subscription{req.Sub.Env, empty}
				m[req.Sub.Env] = &sub
				log.Printf("%s will be scanned", req.Sub.Env)
			case DEL:
				delete(m, req.Sub.Env)
				log.Printf("%s won't be scanned", req.Sub.Env)
			case SCAN:
				sub, prs := m[req.Sub.Env]
				if !prs {
					sub = &model.Subscription{req.Sub.Env, empty}
				}
				sc <- *sub
			case PULL:
				sub, prs := m[req.Sub.Env]
				if !prs {
					log.Printf("Not found")
					sub = &model.Subscription{req.Sub.Env, empty}
				}
				log.Printf("%s", sub.Apps)
				ch <- &ScannerRequest{RET, sub}
			}
		}
	}
}

