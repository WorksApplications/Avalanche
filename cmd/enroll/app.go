package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
)

type Ctx struct {
	detect string
}

type Response struct {
	name    string
	isAlive bool
}

func getAllEnvironment(det string) []string {
	g, gete := http.Get(det + "/config/environments")
	if gete != nil {
		// Do something
		return nil
	}
	defer g.Body.Close()
	b, reade := ioutil.ReadAll(g.Body)
	if reade != nil {
		// Do some
		return nil
	}
	type Resp struct {
		Name string `json:"name"`
		Kapi string `json:"kubernetes_api,omitempty"`
	}
	var rs []Resp

	log.Print(string(b))
	err := json.Unmarshal(b, &rs)
	if err != nil {
		log.Println("err:", err)
	}
	log.Printf("%+v", rs)
	ret := make([]string, len(rs))
	for i, r := range rs {
		ret[i] = r.Kapi
	}
	return ret
}

func getRunningPodsFrom(kapi string) []string {
	g, gete := http.Get(kapi + "/api/v1/pods")
	if gete != nil {
		log.Print("Failed to get kubernetes API response: ", gete)
		return nil
	}
	defer g.Body.Close()
	b, reade := ioutil.ReadAll(g.Body)
	if reade != nil {
		log.Print("Failed to read response content from kubernetes API", reade)
		return nil
	}
	type K8sPod struct {
		name string
	}
	type K8sPodList struct {
		kind  string
		items []K8sPod
	}
	var ps K8sPodList
	json.Unmarshal(b, &ps)
	log.Printf("%+v", ps)
	// Validate something
	// XXX...

	ret := make([]string, len(ps.items))
	for i, p := range ps.items {
		ret[i] = p.name
	}
	return ret
}

func (s *Ctx) handleFunc(w http.ResponseWriter, r *http.Request) {
	es := getAllEnvironment(s.detect)
	log.Print(es)

	ps := make([]string, 0)
	log.Print(ps)
	for _, e := range es {
		if e == "" {
			continue
		}
		px := getRunningPodsFrom(e)
		ps = append(ps, px...)
	}

	b, err := json.Marshal(ps)
	if err != nil {
		log.Printf("Marshal failed with %+v, error: %s", ps, err)
	}
	w.Write(b)
}

func main() {
	log.SetPrefix("enroll:\t")
	detect := flag.String("detect", "http://detect:8080", "detect server address")
	port := flag.Int("port", 8080, "Listen port")

	flag.Parse()
	log.Println("detect address at:", *detect)
	listener, _ := net.Listen("tcp", fmt.Sprintf(":%d", *port))

	c := Ctx{*detect}

	http.HandleFunc("/", c.handleFunc)
	log.Fatal(http.Serve(listener, nil))
}
