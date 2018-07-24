package main

import (
    "container/list"
    "net/http"
    //"fmt"
    "log"
    //"io/ioutil"
    //"bytes"
    "strings"
    "golang.org/x/net/html"
)

var prefix string = "http://mischo.internal.worksap.com/"

type Subscription struct {
    environment string
    buks []Node
}

type Node struct {
    dir string
    apps []App
}

type App struct {
    name string
    pods []Pods
}

type Pods struct {
    name string
    node Node
}

func findNode(z *html.Tokenizer) []string {
    var ns []string
    for {
        tt := z.Next()
        switch {
        case tt == html.ErrorToken:
            return ns
        case tt == html.StartTagToken:
            t := z.Token()
            if t.Data == "a" {
                for _, attr := range t.Attr {
                    if strings.HasPrefix(attr.Val, "kubernetes") {
                        ns = append(ns, attr.Val)
                        log.Print("\t[Found] " + attr.Val)
                        continue;
                    }
                }
            }
        }
    }
    return ns
}

func followLink(site string, debug bool) ([]string, error) {
    if debug {
        log.Print(site)
    }
    resp, err := http.Get(site)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    z := html.NewTokenizer(resp.Body)

    var lxs []string
    for {
        tt := z.Next()
        switch {
        case tt == html.ErrorToken:
            return lxs, nil
        case tt == html.StartTagToken:
            t := z.Token()
            if t.Data == "a" {
                for _, attr := range t.Attr {
                    if attr.Key == "href" && attr.Val != "../" {
                        lxs = append(lxs, attr.Val)
                    }
                }
            }
        }
    }
    return lxs, nil
}

func (s Subscription) Scan() (*App, error) {
    resp, err := http.Get(prefix + s.environment + "/log")
    if err != nil {
        log.Fatal(err)
        return nil, err
    }
    /* Read mischo/environment */
    defer resp.Body.Close()
    z := html.NewTokenizer(resp.Body)
    log.Print("[Scan] " + s.environment)
    ns := findNode(z)
    
    /* See each node */
    for i := 0; i < len(ns); i++ {
        z := prefix + s.environment + "/log/" + ns[i] + "msa/"
        tens, _ := followLink(z, false) /* Assume we have tenants */

        for _,t := range tens {
            z1 := z + t
            ls, _ := followLink(z1, false)
            for _, l := range ls {
                apps, _ := followLink(z1 + l, false)
                for _, a := range apps {
                    log.Print(a)
                }
            }
        }
    }
    return nil, nil
}

func main() {
    sxs := list.New()
    s := Subscription{"jill-jack-k-single-jill", nil}
    sxs.PushFront(s)
    
    log.SetPrefix("collect:\t")
    s.Scan()
    //http.HandleFunc("/subscription", s.Poll)
    //log.Fatal(http.ListenAndServe(":8080", nil))
}
