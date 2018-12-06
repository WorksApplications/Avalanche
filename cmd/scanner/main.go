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
	ch        chan *ScannerRequest
	db        *sql.DB
	scanner   scanner.Driver
	ready     chan struct{}
	pathtempl string
	period    int
}

func dispatch(ic <-chan *scanner.Subscription, oc chan<- *scanner.Subscription, sc scanner.Driver, pathtempl string) {
	log.Printf("[Dispatched worker] Enter")
	for s := range ic {
		go func(s *scanner.Subscription) {
			log.Printf("[Dispatched worker] Start scan for %s", s.Env)
			apps, req, dur := scanner.Scan(s.Env, pathtempl, sc)
			found := 0
			for _, a := range apps {
				found += len(a.Pods)
			}
			log.Printf("[Dispatched worker] Scan for %s end: found %d by %d requests sent in %s", s.Env, found, req, dur)
			s.Apps = apps
			s.OnGoing = false
			oc <- s
		}(s)
	}
	log.Printf("[Dispatched worker] Exit")
}

func (c *cfg) exchange() {
	t := time.Tick(time.Duration(c.period) * time.Second)
	m := make(map[string]*scanner.Subscription)
	empty := make([]scanner.App, 0)
	// isc: where a subscription goes to represent a scan request
	// osc: where the subscription with its result comes
	isc := make(chan *scanner.Subscription, 64) // XXX: May have to be extended
	osc := make(chan *scanner.Subscription, 64) // XXX: May have to be extended
	go dispatch(isc, osc, c.scanner, c.pathtempl)
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
	templhelp := "Template path for perf-log search.\n variables:\n\t$any: matches any\n" +
		"\t$env: mathes any string and returned as name of environment\n" +
		"\t$app: mathes any string and returned as name of application\n" +
		"\t$pod: mathes any string and returned as name of pod\n"
	dbconf := flag.String("db", "example:example@localhost?parseTime=True", "DB address")
	logdir := flag.String("logLocation", "http://akashic.example.com/logs", "URL for log storage location")
	logtype := flag.String("logType", "nginx", "log storage type: nginx, disk (will be implemented for s3, disk)")
	logtempl := flag.String("logTempl", "log/ap-$any/stg-$env/$app/var/log/$pod/perf-log", templhelp)
	scanperi := flag.Int("scanPeriod", 300, "Period between an invocation for bulk scan and another (in second)")
	flag.Parse()
	args := flag.Args()
	log.Println(args)

	db, err := sql.Open("mysql", *dbconf)
	if err != nil {
		log.Fatalln("Error on db", err)
	}

	var s scanner.Driver
	switch *logtype {
	default:
		fallthrough
	case "nginx":
		s = &scanner.Nginx{*logdir, 0}
	case "disk":
		s = &scanner.Disk{*logdir, 0}
	}

	t := true
	es := environ.ListConfig(db, nil, &t)
	x := cfg{make(chan *ScannerRequest), db, s, make(chan struct{}), *logtempl, *scanperi}
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
