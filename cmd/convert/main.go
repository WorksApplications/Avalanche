package main

import (
	"bufio"
	"bytes"
	"context"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"archive/tar"
	"io/ioutil"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

func findImage(cli *client.Client, ctx context.Context, name string) *types.ImageSummary {
	hints := strings.Split(name, ":")
	if len(hints) == 1 {
		hints = append(hints, "latest")
	}
	images, err := cli.ImageList(ctx, types.ImageListOptions{})
	if err != nil {
		panic(err)
	}

	for _, image := range images {
		for _, t := range image.RepoTags {
			if t == (hints[0] + ":" + hints[1]) {
				return &image
			}
		}
	}
	return nil
}

func build(cli *client.Client, ctx context.Context, b io.Reader, options types.ImageBuildOptions) {
	resp, err := cli.ImageBuild(ctx, b, options)
	if err != nil {
		fmt.Println(err)
		return
	}
	buf := new(bytes.Buffer)
	buf.ReadFrom(resp.Body)
	fmt.Printf(buf.String())
}

func inspectImage(cli *client.Client, ctx context.Context, name string) (string, []string) {
	image := findImage(cli, context.Background(), name)
	if image == nil {
		return "", []string{}
	}
	ins, _, _ := cli.ImageInspectWithRaw(context.Background(), image.ID)
	cmds := append(ins.Config.Entrypoint, ins.Config.Cmd...)
	fmt.Printf("Found %s %dKB, %s, CMD: %s\n", image.ID, image.Size/1024, image.RepoTags, cmds)
	return image.RepoTags[0], cmds
}

func (s *dockerContext) genDockerfile(name, cmds string) string {
	templ := "FROM %s\n%s\n%s\nCMD [%s]\n"
	envs := ""
	for _, env := range s.envs {
		envs = envs + fmt.Sprintf("ENV %s %s\n", env.name, env.val)
	}
	adds := ""
	for _, file := range s.files {
		adds = adds + fmt.Sprintf("ADD %s %s\n", file.src, file.dst)
	}
	return fmt.Sprintf(templ, name, envs, adds, cmds)
}

func (s *dockerContext) injectStringFile(file, dst, content string) error {
	return s.injectFile(file, dst, strings.NewReader(content), int64(len(content)))
}

func (s *dockerContext) injectFile(filename, dst string, data io.Reader, length int64) error {
	hdr := &tar.Header{
		Name: filename,
		Mode: 0777,
		Size: int64(length),
	}
	if err := s.tw.WriteHeader(hdr); err != nil {
		fmt.Println(err)
		return err
	}
	if _, err := io.Copy(s.tw, data); err != nil {
		fmt.Println(err)
		return err
	}
	s.files = append(s.files, struct {
		src string
		dst string
	}{filename, dst})
	return nil
}

func downloadImage(cli *client.Client, save io.Writer, ctx context.Context, id string) {
	read, _ := cli.ImageSave(ctx, []string{id})
	defer read.Close()

	if _, err := io.Copy(save, read); err != nil {
		fmt.Println(err)
	}
}

func untarOne(tr *tar.Reader, path string) {
	os.MkdirAll(filepath.Dir(path), 0777)
	f, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	wt := bufio.NewWriter(f)
	if io.Copy(wt, tr); err != nil {
		panic(err)
	}
	if err := f.Chmod(0777); err != nil {
		fmt.Println("Can't change the permission. ignore...")
	}
	wt.Flush()
}

func getBinaryFromFsOrDockerImage(cli *client.Client, name, path string) (string, string, string) {
	if name == "" {
		if _, err := os.Stat(path); err != nil {
			fmt.Println(err)
			return "", "", ""
		}
		fmt.Printf("[dependency binary] using: %s\n", path)
		/* return local binary. Assume "/bin/" is in $PATH in target image */
		return path, "/bin/" + filepath.Base(path), ""
	}
	temp, _ := ioutil.TempDir(os.TempDir(), "injector-")
	f, _ := os.Create(temp + "/" + "image.tar")
	fmt.Println(temp)
	w := bufio.NewWriter(f)
	image := findImage(cli, context.Background(), name)
	downloadImage(cli, w, context.Background(), image.ID)

	w.Flush()
	f.Close()
	r, _ := os.Open(temp + "/" + "image.tar")
	tr := tar.NewReader(r)
	layers := make([]string, 0)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			panic(err)
		}
		/* Got the layer.tar; can't wait to open! */
		if strings.HasSuffix(hdr.Name, "layer.tar") {
			fmt.Printf("[untar] %s:\n", hdr.Name)
			untarOne(tr, temp+"/"+hdr.Name)
			layers = append(layers, temp+"/"+hdr.Name)
		}
	}
	for _, layer := range layers {
		r, err := os.Open(layer)
		fmt.Println("Open layer: ", layer, err)
		if err != nil {
			panic(err)
		}
		lr := tar.NewReader(r)
		laybase := filepath.Dir(layer)
		for {
			hdr, err := lr.Next()
			if err == io.EOF {
				break
			}
			if err != nil {
				panic(err)
			}
			if ("/" + hdr.Name) == path {
				binpath := laybase + "/" + path
				fmt.Printf("[dependency binary] saved: %s\n", binpath)
				untarOne(lr, laybase+"/"+hdr.Name)
				return binpath, hdr.Name, temp
			}
		}
	}
	return "", "", temp
}

type dockerContext struct {
	tw    *tar.Writer
	files []struct {
		src string
		dst string
	}
	envs []struct {
		name string
		val  string
	}
}

func main() {
	apiVer := flag.String("apiVersion", "1.38", "API version for docker daemon")
	imageName := flag.String("image", "", "target docker image")
	targetProc := flag.String("targetProcName", "java", "The environment variable name for Java options")
	javaOptEnv := flag.String("javaOptEnvName", "JAVA_OPTS", "The environment variable name for Java options")
	logDir := flag.String("logDir", "/var/log/${APPNAME}/perf-record", "log directory for perf output archive")
	loggerFile := flag.String("logger", "script/perflogger.sh", "Logger script")
	perfImage := flag.String("perfImage", "linuxkit/kernel-perf:4.14.88", "The image for perf. If it is explicitly set empty, use local fs.")
	perfPath := flag.String("perfPath", "/usr/bin/perf", "Path to perf in perfImage")
	inotifyImage := flag.String("inotifyImage", "", "The image for inotifywait. If it is left empty, use local fs.")
	inotifyPath := flag.String("inotifyPath", "/usr/bin/inotifywait", "Path to inotifywait in inotifyImage")
	agentImage := flag.String("perfMapAgentImage", "", "The image for perf-map-agent.tar.gz. If it is left empty, use local fs.")
	agentPath := flag.String("perfMapAgentPath", "", "Path to inotifywait in PerfMapAgentImage.\n"+
		"\tThe archive structure must contain perf-map-agent/ as an immediate child, and it must contain bin/perf-map-agent.sh and so on.")
	dryRun := flag.Bool("dryRun", false, "dry-run")
	flag.Parse()
	args := flag.Args()
	fmt.Println(args)

	cli, err := client.NewEnvClient()
	client.WithVersion(*apiVer)(cli)
	if err != nil {
		panic(err)
	}

	/* Prepare perf binary */
	perfpath, perfname, tempP := getBinaryFromFsOrDockerImage(cli, *perfImage, *perfPath)
	if tempP != "" {
		defer os.RemoveAll(tempP)
	}
	if perfpath == "" {
		fmt.Println("Couldn't find perf binary from specified image or path")
		return
	}

	/* Prepare inotify binary */
	inotifypath, inotifyname, tempI := getBinaryFromFsOrDockerImage(cli, *inotifyImage, *inotifyPath)
	if tempI != "" {
		defer os.RemoveAll(tempI)
	}
	if inotifypath == "" {
		fmt.Println("Couldn't find inotify binary from specified image or path")
		return
	}

	/* Prepare perf-map-agent */
	agentpath, agentname, tempA := getBinaryFromFsOrDockerImage(cli, *agentImage, *agentPath)
	if tempA != "" {
		defer os.RemoveAll(tempA)
	}
	if agentpath == "" {
		fmt.Println("Couldn't find perf-map-agent archive from specified image or path")
		return
	}

	/* Prepare base image */
	name, cmds := inspectImage(cli, context.Background(), *imageName)

	/* Prepare docker build context */
	buf := new(bytes.Buffer)
	docker := dockerContext{
		tw: tar.NewWriter(buf),
	}

	for _, file := range []struct {
		path string
		name string
		dst  string
	}{
		{path: *loggerFile, name: "logger.sh", dst: "logger.sh"},
		{path: perfpath, name: perfname, dst: perfname},
		{path: inotifypath, name: inotifyname, dst: inotifyname},
		/* XXX: use ldd?? */
		{path: "/usr/lib/libinotifytools.so.0.4.1", name: "libinotifytools.so.0", dst: "/usr/lib/"},
		{path: agentpath, name: agentname, dst: "/usr/bin/"}} {
		f, err := os.Open(file.path)
		if err != nil {
			return
		}

		info, _ := f.Stat()
		docker.injectFile(file.name, file.dst, f, info.Size())
	}

	commandStr := "\"./logger.sh\""
	for _, cmd := range cmds {
		commandStr = commandStr + fmt.Sprintf(", \"%s\" ", cmd)
	}
	docker.injectStringFile("/bin/sudo", "/bin/sudo", "#!/bin/sh\n\n$@")

	docker.envs = []struct {
		name string
		val  string
	}{
		{"TARGETPROC", *targetProc},
		{"PERF_ARCHIVE_FILE", *logDir},
		{"JAVAOPTS_ENVNAME", *javaOptEnv},
	}

	dockerfile := docker.genDockerfile(name, commandStr)
	fmt.Println("=== Dockerfile generated ===\n" + dockerfile + "============")
	docker.injectStringFile("Dockerfile", "Dockerfile", dockerfile)

	if err := docker.tw.Close(); err != nil {
		fmt.Println(err)
		return
	}
	docker.tw.Flush()

	if *dryRun {
		fmt.Println(buf)
		return
	}

	options := types.ImageBuildOptions{Platform: "linux"}
	options.Dockerfile = "Dockerfile"
	options.PullParent = true
	build(cli, context.Background(), buf, options)
}
