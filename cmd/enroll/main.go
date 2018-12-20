/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
    "regexp"
	"strings"
)

type Ctx struct {
	scanner string
	filter  func(string) bool
}

type MetaResponse struct {
	List   []Response
	Source string
}

type Response struct {
	Name     string
	Image    string
	IsTraced bool
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

	err := json.Unmarshal(b, &rs)
	if err != nil {
		log.Println("err:", err)
	}
	ret := make([]string, len(rs))
	for i, r := range rs {
		ret[i] = r.Kapi
	}
	return ret
}

func getRunningPodsFrom(kapi string, filter func(string) bool) []Response {
	g, gete := http.Get(kapi + "/api/v1/pods")
	if gete != nil {
		log.Print("Failed to get kubernetes API response: ", gete, "@", kapi)
		return nil
	}
	defer g.Body.Close()
	b, reade := ioutil.ReadAll(g.Body)
	if reade != nil {
		log.Print("Failed to read response content from kubernetes API", reade, "@", kapi)
		return nil
	}
	type K8sPod struct {
		Metadata struct {
			Name   string `json:"name"`
			Labels struct {
				Name string `json:"name"`
			} `json:"labels"`
		} `json:"metadata"`
		Spec struct {
			Containers []struct {
				Name  string `json:"name"`
				Image string `json:"image"`
			} `json:"containers"`
		} `json:"spec"`
	}
	type K8sPodList struct {
		Kind       string   `json:"kind"`
		ApiVersion string   `json:"apiVersion"`
		Items      []K8sPod `json:"items"`
	}
	var ps K8sPodList
	json.Unmarshal(b, &ps)
	// Validate something
	// XXX...

	ret := make([]Response, 0, len(ps.Items))
	for _, p := range ps.Items {
		var r Response
		/* Iterate over containers to find main one */
		for _, c := range p.Spec.Containers {
			if c.Name == p.Metadata.Labels.Name {
				r.Image = c.Image
				if filter(c.Image) {
					r.IsTraced = true
				}
			}
		}
		r.Name = p.Metadata.Name
		ret = append(ret, r)
	}
	return ret
}

func (s *Ctx) handleFunc(w http.ResponseWriter, r *http.Request) {
	log.Print(r.Proto, r.Method, ": ", r.URL, " | Header: ", r.Header)
	es := getAllEnvironment(s.scanner)

	ps := make([]MetaResponse, 0)
	for _, e := range es {
		if e == "" {
			continue
		}
		px := getRunningPodsFrom(e, s.filter)
		ps = append(ps, MetaResponse{px, e})
	}

	b, err := json.Marshal(ps)
	if err != nil {
		log.Printf("Marshal failed with %+v, error: %s", ps, err)
	}
	w.Write(b)
}

func main() {
	log.SetPrefix("enroll:\t")
	log.SetFlags(log.Lshortfile)
	scanner := flag.String("scanner", "http://scanner:8080", "scanner server address")
    perfMonitorName := flag.String("loggingImage", ".*-perf-monitor:.*", "the name of logging image (regex)")
	port := flag.Int("port", 8080, "Listen port")

	flag.Parse()
    reImage := regexp.MustCompile(*perfMonitorName)
	log.Println("scanner address at:", *scanner)
	listener, _ := net.Listen("tcp", fmt.Sprintf(":%d", *port))

	c := Ctx{*scanner, func(s string) bool {
        return reImage.MatchString(s)
	}}

	http.HandleFunc("/", c.handleFunc)
	log.Fatal(http.Serve(listener, nil))
}
