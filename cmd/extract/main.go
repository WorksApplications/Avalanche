package main

import (
	"archive/tar"
	"compress/gzip"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/xi2/xz"
)

func getLog(root *url.URL, resource string) (io.ReadCloser, error) {
	// TODO: handle trailing slash
	addr := root.String() + resource
	if root.Scheme == "file" {
		return os.Open(addr)
	} else {
		resp, err := http.Get(addr)
		if err != nil {
			return nil, err
		}
		return resp.Body, nil
	}
}

func asTape(name string, in io.Reader) (io.Reader, error) {
	switch filepath.Ext(filepath.Base(name)) {
	case ".tar":
		return in, nil
	case ".gz":
		return gzip.NewReader(in)
	case ".xz":
		return xz.NewReader(in, 0)
	default:
		return nil, fmt.Errorf("Unknown archive type: %s (ext: %s)", name, filepath.Ext(filepath.Base(name)))
	}
}

func (c *config) handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, fmt.Sprintf("method %s is not supported", r.Method), 404)
		return
	}
	q := r.URL.Query()
	resource := q.Get("resource")
	ar, err := getLog(c.logAt, resource)
	if err != nil {
		http.Error(w, fmt.Sprintf("Fail to fetch archive %s (%v)", c.logAt.String()+resource, err), 503)
		return
	}
	defer ar.Close()

	tape, err := asTape(resource, ar)
	if err != nil {
		msg := fmt.Sprintf("failed to decompress: %s (%v)", c.logAt.String()+resource, err)
		log.Print(msg)
		http.Error(w, msg, 503)
		return
	}

	files := make([]string, 0)
	tr := tar.NewReader(tape)
	for hdr, err := tr.Next(); err != io.EOF; hdr, err = tr.Next() {
		if err != nil {
			msg := fmt.Sprintf("Fail to unarchive %s (%v)", c.logAt.String()+resource, err)
			log.Print(msg)
			http.Error(w, msg, 503)
			return
		}
		if hdr == nil {
			continue
		}
		/*XXX: For data integrity, use / to untar. This may break consistency while processing. */
		dst := "/" + hdr.Name
		os.MkdirAll(filepath.Dir(dst), 0777)
		file, _ := os.Create(dst)
		io.Copy(file, tr)
		defer os.Remove(dst)
		if !(strings.HasSuffix(dst, ".data") || strings.HasSuffix(dst, ".map")) {
			files = append(files, dst)
		}
	}
	sort.Strings(files)

	/* OK! here we go! */
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	for _, file := range files {
		log.Println(file)
		cmd := exec.CommandContext(r.Context(), "perf", "script", "-i", file)
		stdout, err := cmd.StdoutPipe()
		if err != nil || cmd.Start() != nil {
			log.Print("execution failed", err)
			http.Error(w, fmt.Sprintf("Fail to execute with %s (%v)", file, err), 503)
			return
		}
		cmd.Start()
		io.Copy(w, stdout)
		if err := cmd.Wait(); err != nil {
			log.Print("execution failed at end", err)
			break
		}
	}
}

type config struct {
	mapRe *regexp.Regexp
	logAt *url.URL
}

func main() {
	at := flag.String("serve", ":8080", "Server setting")
	logAt := flag.String("logServer", "http://localhost", "Log server address (http://) or volume location (file://)")
	flag.Parse()

	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)

	//perf_map_regex = re.compile(r'^perf[0-9]+\.map$')

	url, err := url.Parse(*logAt)
	if err != nil {
		log.Fatal("The option \"logServer\" is malformed.", *logAt, err)
	}
	conf := config{
		mapRe: regexp.MustCompile(`^perf[0-9]+\.map$`),
		logAt: url,
	}

	http.HandleFunc("/", conf.handler)
	log.Fatal(http.ListenAndServe(*at, nil))
}
