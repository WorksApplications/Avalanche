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

func genDockerfile(name, cmds, targetProc, javaOptEnv, logDir string) string {
	templ := `
    FROM %s
    ENV TARGETPROC %s
    ENV PERF_ARCHIVE_FILE %s
    ADD logger.sh .
    CMD [%s]
    `
	return fmt.Sprintf(templ, name, targetProc, logDir, cmds)
}

func injectDockerfile(tw *tar.Writer, dockerfile string) {
	injectFile(tw, "Dockerfile", strings.NewReader(dockerfile), int64(len(dockerfile)))
}

func injectFile(tw *tar.Writer, filename string, data io.Reader, length int64) {
	hdr := &tar.Header{
		Name: filename,
		Mode: 0777,
		Size: int64(length),
	}
	if err := tw.WriteHeader(hdr); err != nil {
		fmt.Println(err)
		return
	}
	if _, err := io.Copy(tw, data); err != nil {
		fmt.Println(err)
		return
	}
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

func getPerfBinary(cli *client.Client, name, path string) /*io.Reader*/ {
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
				fmt.Printf("[found perf binary] saved: %s\n", laybase+"/"+path)
				untarOne(lr, laybase+"/"+hdr.Name)
			}
		}

	}
}

func buildPerfMapAgent() {
}

func main() {
	apiVer := flag.String("apiVersion", "1.38", "API version for docker daemon")
	imageName := flag.String("image", "", "target docker image")
	targetProc := flag.String("targetProcName", "java", "The environment variable name for Java options")
	javaOptEnv := flag.String("javaOptEnvName", "JAVA_OPTS", "The environment variable name for Java options")
	logDir := flag.String("logDir", "/var/log/${APPNAME}/perf-record", "log directory for perf output archive")
	loggerFile := flag.String("logger", "script/perflogger.sh", "Logger script")
	perfBaseImage := flag.String("perfBaseImage", "linuxkit/kernel-perf:4.14.88", "The image for perf")
	perfPath := flag.String("perfPath", "/usr/bin/perf", "Path to perf in perfBaseImage")
	dryRun := flag.Bool("dryRun", false, "dry-run")
	flag.Parse()
	args := flag.Args()
	fmt.Println(args)

	cli, err := client.NewEnvClient()
	client.WithVersion(*apiVer)(cli)
	if err != nil {
		panic(err)
	}

	getPerfBinary(cli, *perfBaseImage, *perfPath)
	name, cmds := inspectImage(cli, context.Background(), *imageName)

	options := types.ImageBuildOptions{Platform: "linux"}
	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)

	f, err := os.Open(*loggerFile)
	if err != nil {
		return
	}

	info, _ := f.Stat()

	commandStr := "\"./logger.sh\""
	for _, cmd := range cmds {
		commandStr = commandStr + fmt.Sprintf(", \"%s\" ", cmd)
	}
	injectDockerfile(tw, genDockerfile(name, commandStr, *targetProc, *javaOptEnv, *logDir))
	injectFile(tw, "logger.sh", f, info.Size())

	if err := tw.Close(); err != nil {
		fmt.Println(err)
		return
	}
	tw.Flush()

	if *dryRun {
		fmt.Println(buf)
		return
	}

	options.Dockerfile = "Dockerfile"
	options.PullParent = true
	build(cli, context.Background(), buf, options)
}