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
			"uuid CHAR(80), " +
			"envid int, " +
			"appid int, " +
			"layid int, " +
			"podid int, " +
			"created DATETIME, " +
			"pvloc CHAR(80), " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Snapshot] Initiate: ", res, err)
}

func List(db *sql.DB, where *string) []*models.Snapshot {
	rows, err := db.Query(fmt.Sprintf("SELECT uuid, created, appid, envid, layid, pvloc FROM snapshot %s", *where))
	if err != nil {
		log.Fatal("[DB/Snapshot] ", err)
		return nil
	}
	defer rows.Close()

	sxs := make([]*models.Snapshot, 0)
	for rows.Next() {
		sx := models.Snapshot{}
		var appid int64
		var envid int64
		var layid int64
		var link string
		err = rows.Scan(&sx.UUID, &sx.CreatedAt, &appid, &envid, &layid, &link)
		if err != nil {
			log.Print("[DB/Snapshot] Scan", err)
		}
		sxs = append(sxs, &sx)
	}
	return sxs
}

func FromPod(db *sql.DB, p *models.Pod) []*models.Snapshot {
	wh := fmt.Sprintf("WHERE podid = \"%d\"", p.ID)
	return List(db, &wh)
}

func getSS(pvmountp *string, link *string, pname *string) (string, error) {
	/* try access to the "perf.tar.gz" file for extract */
	g, eg := http.Get(*link)
	if eg != nil || g.StatusCode != http.StatusOK {
		remo_msg := ""
		if eg == nil {
			msg, _ := ioutil.ReadAll(g.Body)
			remo_msg = string(msg)
		}
		log.Print("[Snapshot/error in retrieving]", eg, *link, g, remo_msg)
		return "", fmt.Errorf("Snapshot wasn't retrievable! Check mischo: err:%+v, link:%s", eg, *link)
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
	log.Print("[Snapshot] data moved to ", d+uuid.String())
	return uuid.String(), nil
}

func New(extr *string, m *string, db *sql.DB, a *models.App, p *models.Pod, l *layout.Layout) *models.Snapshot {
	k, err := url.Parse(pod.ToLogAddress(db, p.ID))
	if err != nil {
		return nil
	}
	/* XXX fix to point perf data location XXX */
	link := *extr + "/?resource=" + k.Path + "perf-record/perf-" + *a.Name + ".tar.gz"
	log.Printf("LINK ADDRESS: %s", link)
	g, err := getSS(m, &link, p.Name)
	if err != nil {
		log.Printf("[Snapshot] Couldn't get snapshot")
		return nil
	}
	log.Printf("[DB/Snapshot] Storing (%d @ %d: %d)", l.AppId, l.EnvId)
	t := time.Now()
	res, err := db.Exec("INSERT INTO snapshot(name, pvloc, appid, envid, podid, layid, created) values (?, ?, ?, ?, ?, ?, ?)", p.Name, g, l.AppId, l.EnvId, p.ID, l.Id, t)
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
