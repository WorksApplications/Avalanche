package snapshot

import (
	"database/sql"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/go-openapi/strfmt"
	"github.com/google/uuid"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"

	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
)

func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE snapshot(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(80), " +
			"uuid CHAR(80), " +
			"envid int, " +
			"appid int, " +
			"layid int, " +
			"lives int, " +
			"created DATETIME, " +
			"pvloc CHAR(80), " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Snapshot] Initiate: ", res, err)
}

func getSS(pvmountp *string, link *string, pname *string) (string, error) {
	/* try access to the "perf.tar.gz" file */
	g, eg := http.Get(*link)
	if g.StatusCode != http.StatusOK || eg != nil {
		log.Print("[Snapshot/error in retrieving]", eg, *link, g)
		return "", fmt.Errorf("Snapshot wasn't retrievable! err:%+v, link:%s", eg, *link)
	}
	defer g.Body.Close()
	f, ef := ioutil.TempFile("/tmp", "SNPSCHT-"+*pname+"-")
	if ef != nil {
		log.Print("[Snapshot/error in TempFile]", ef)
		return "", fmt.Errorf("Temporal Snapshot file is failed to be created!: %+v", ef)
	}
	defer f.Close()
	/* Dump the response into tempfile instead of persistent volume not to save incomplete files. */
	_, ec := io.Copy(f, g.Body)
	if ec != nil {
		log.Print("[Snapshot/error in Saving]", ec)
		return "", fmt.Errorf("Snapshot wasn't saved even temporarily!: %+v", ef)
	}
	log.Print("[Snapshot] download OK at ", f.Name())

	uuid := uuid.New()
	/* midst byte is used for choosing directory-as-prefix.
	   This is better for human eyes because they tend to use first or last bytes for filtering.
	   Also note that the Node part is the _random_ part. */
	d := fmt.Sprintf("%s/%x/", *pvmountp, uuid.NodeID()[3])
	/* ... and pave the path */
	os.MkdirAll(d, 0755)

	er := os.Rename(f.Name(), d+uuid.String())
	if er != nil {
		log.Print("[Snapshot/error] Saving to persistent volume failed:", d, "|||", f.Name(), ":::", er)
		return "", fmt.Errorf("Saving to persistent volume failed:", d, "|||", f.Name(), ":::", er)
	}
	return uuid.String(), nil
}

func New(extr *string, m *string, db *sql.DB, p *models.Pod, l *layout.Layout) *models.Snapshot {
	log.Printf("[DB/Snapshot] Storing (%d @ %d: %d)", l.AppId, l.EnvId)
	k, err := url.Parse(pod.ToLogAddress(db, p.ID))
	if err != nil {
		return nil
	}
	/* XXX fix to point perf data location XXX */
	link := *extr + "/?resource=" + k.Path + "perf-data/" + p.Name + "-perf.tar.gz"
	log.Printf("LINK ADDRESS: %s", link)
	g, err := getSS(m, &link, p.Name)
	if err != nil {
		return nil
	}
	t := time.Now()
	res, err := db.Exec("INSERT INTO snapshot(name, pvloc, appid, envid, layid, created) values (?, ?, ?, ?, ?, ?)", p.Name, g, l.AppId, l.EnvId, l.Id, t)
	log.Println("[DB/Snapshot] NEW: ", res, err)
	if err != nil {
		return nil
	}
	ss := models.Snapshot{
		strfmt.DateTime(t),
		"",
		"",
		*p.Name,
		&g,
	}
	return &ss
}
