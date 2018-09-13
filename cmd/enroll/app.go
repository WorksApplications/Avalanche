package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"strings"
	"io/ioutil"
	"net/http"
	"encoding/json"
)

type Ctx struct {
	detect string
    filter func(string) bool
}

type Response struct {
	Name    string
    Image   string
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
		Kapi string `json:"kubernetesApi"`
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

func getRunningPodsFrom(kapi string, filter func(string) bool) []Response {
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
        Metadata struct {
            Name string `json:"name"`
            Labels struct {
                Name string `json:"name"`
            } `json:"labels"`
        } `json:"metadata"`
        Spec struct {
            Containers []struct {
                Name string `json:"name"`
                Image string `json:"image"`
            } `json:"containers"`
        } `json:"spec"`
	}
	type K8sPodList struct {
        Kind  string `json:"kind"`
        ApiVersion string `json:"apiVersion"`
        Items []K8sPod `json:"items"`
	}
	var ps K8sPodList
	json.Unmarshal(b, &ps)
	log.Printf("%+v", ps)
	// Validate something
	// XXX...

	ret := make([]Response, 0, len(ps.Items))
	for _, p := range ps.Items {
        var r Response
        for _,c := range p.Spec.Containers {
            if c.Name == p.Metadata.Labels.Name {
                r.Image = c.Image
            } else if filter(c.Image) {
                r.Image = c.Image
            }
        }
        r.Name = p.Metadata.Name
        if r.Image == "" {
            continue
        }
        ret = append(ret, r)
	}
	return ret
}

func (s *Ctx) handleFunc(w http.ResponseWriter, r *http.Request) {
	es := getAllEnvironment(s.detect)
	log.Print(es)

	ps := make([]Response, 0)
	for _, e := range es {
		if e == "" {
			continue
		}
		px := getRunningPodsFrom(e, s.filter)
		ps = append(ps, px...)
	}

	log.Print(ps)
	b, err := json.Marshal(ps)
	if err != nil {
		log.Printf("Marshal failed with %+v, error: %s", ps, err)
	}
	w.Write(b)
}

func main() {
	log.SetPrefix("enroll:\t")
    log.SetFlags(log.Lshortfile)
	detect := flag.String("detect", "http://detect:8080", "detect server address")
	perfMonitorImage := flag.String("monitorImage", "release-docker.worksap.com/release-test/tomcat-base-perf-monitor", "the name of monitoring image")
	perfMonitorLabel := flag.String("monitorLabel", "", "the label of monitoring image")
    useMonitorImage := flag.Bool("useMonitorImage", true, "indicates whether the \"-monitorImage\" flag determines the monitoring image")
    useMonitorLabel := flag.Bool("useMonitorLabel", false, "indicates whether the \"-monitorLabel\" flag determines the monitoring image")
	port := flag.Int("port", 8080, "Listen port")

	flag.Parse()
	log.Println("detect address at:", *detect)
	listener, _ := net.Listen("tcp", fmt.Sprintf(":%d", *port))

	c := Ctx{*detect, func (s string) bool {
        im := strings.Split(s, ":")
        if (*useMonitorImage && *useMonitorLabel) {
            return im[0] == *perfMonitorImage && im[1] == *perfMonitorLabel
        } else if *useMonitorImage {
            return im[0] == *perfMonitorImage
        } else if *useMonitorLabel {
            return im[1] == *perfMonitorLabel
        } else {
            log.Fatal("Neither of useMonitorLabel and useMonitorImage is specified")
            return false
        }
    }}

	http.HandleFunc("/", c.handleFunc)
	log.Fatal(http.Serve(listener, nil))
}
