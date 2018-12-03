package main

import (
	"database/sql"
	"flag"
	"log"
	"net/http"
	"time"

	_ "github.com/go-sql-driver/mysql"

	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/log-scanner"
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
	Ret chan<- *scanner.Subscription
}

type cfg struct {
	ch      chan *ScannerRequest
	db      *sql.DB
	scanner scanner.Scanner
	ready   chan struct{}
}

func dispatch(ic <-chan *scanner.Subscription, oc chan<- *scanner.Subscription, sc scanner.Scanner) {
	log.Printf("[Dispatched worker] Enter")
	for s := range ic {
		go func(s *scanner.Subscription) {
			log.Printf("[Dispatched worker] Start scan for %s", s.Env)
			apps, err := sc.Scan(s.Env)
			if err != nil {
				log.Printf("Error in the scan for %s", err)
			}
			log.Printf("[Dispatched worker] Scan for %s ended.", s.Env)
			s.Apps = apps
			s.OnGoing = false
			oc <- s
		}(s)
	}
	log.Printf("[Dispatched worker] Exit")
}

func (c *cfg) exchange() {
	t := time.Tick(5 * time.Minute)
	m := make(map[string]*scanner.Subscription)
	empty := make([]scanner.App, 0)
	// isc: where a subscription goes to represent a scan request
	// osc: where the subscription with its result comes
	isc := make(chan *scanner.Subscription, 64) // XXX: May have to be extended
	osc := make(chan *scanner.Subscription, 64) // XXX: May have to be extended
	go dispatch(isc, osc, c.scanner)
	for {
		select {
		case res := <-osc:
			m[res.Env] = res
		case <-t:
			log.Println("start batch scan")
			for _, s := range m {
				if s.OnGoing {
					/* Do not spawn on-going call again */
					continue
				}
				select {
				case isc <- s:
					s.OnGoing = true
				default:
					log.Println("request buffer is full")
				}
			}
		case req := <-c.ch:
			env := req.Env
			if env == nil && req.Req != DESC {
				log.Printf("WARN: nil exception was almost there! req.Req=%+v", req.Req)
			}
			switch req.Req {
			case ADD:
				sub := scanner.Subscription{*env, empty, false}
				m[*env] = &sub
				log.Printf("%s will be scanned", *env)
			case DEL:
				delete(m, *env)
				log.Printf("%s won't be scanned", *env)
			case SCAN:
				sub, prs := m[*env]
				if !prs {
					sub = &scanner.Subscription{*env, empty, true}
				}
				isc <- sub
				log.Print("[Scan manager] sent:", *env)
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

func main() {
	log.SetPrefix("detect:\t")
	log.SetFlags(log.Lshortfile | log.Ldate | log.Ltime)
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB address")
	logdir := flag.String("logLocation", "http://akashic.example.com/logs", "URL for log storage location")
	logtype := flag.String("logType", "nginx", "log storage type: nginx, disk (will be implemented for s3, disk)")
    logname := flag.String("logName", "perf-record", "Name of the performance log to look for")

	flag.Parse()
	args := flag.Args()
	log.Println(args)

	db, err := sql.Open("mysql", *dbconf)
	if err != nil {
		log.Fatalln("Error on db", err)
	}

	var s scanner.Scanner
	switch *logtype {
	default:
		fallthrough
	case "nginx":
		s = scanner.Nginx{*logdir, *logname}
    case "disk":
		s = scanner.Disk{*logdir, *logname}
	}

	t := true
	es := environ.ListConfig(db, nil, &t)
	x := cfg{make(chan *ScannerRequest), db, s, make(chan struct{})}
	go x.exchange()

	/* initial registration for scan */
	for _, e := range es {
		sreq := ScannerRequest{SCAN, &e.Name, nil}
		x.ch <- &sreq
	}

    /* try to get all environments to see if all of them are scanned */
	for {
		c := make(chan *scanner.Subscription)
		req := ScannerRequest{DESC, nil, c}
		x.ch <- &req
		i := 0
		for range c {
			i++
			if i == len(es) {
				log.Print("All initial targets are scanned. Let's start serving...")
				goto SERVE
			}
		}
		time.Sleep(500 * time.Millisecond)
	}
SERVE:

	http.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
        w.WriteHeader(200)
    })
	http.HandleFunc("/logs/", x.partialGet)
	http.HandleFunc("/logs", x.dump)
	http.HandleFunc("/config/environments", x.ConfigEnv)
	http.HandleFunc("/config/environments/", x.ConfigEnvSub)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
