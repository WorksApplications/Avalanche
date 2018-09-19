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
	"git.paas.workslan/resource_optimization/dynamic_analysis/pkg/environment"

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
			"pvloc CHAR(128), " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Snapshot] Initiate: ", res, err)
}

type SnapshotInternal struct {
	UUID    string
	appid   int64
	podid   int64
	envid   int64
	layid   int64
	link    string
	created time.Time
}

func list(db *sql.DB, where *string) []*SnapshotInternal {
	rows, err := db.Query(fmt.Sprintf("SELECT uuid, created, appid, podid, envid, layid, pvloc FROM snapshot %s", *where))
	if err != nil {
		log.Fatal("[DB/Snapshot] ", err)
		return nil
	}
	defer rows.Close()

	sxs := make([]*SnapshotInternal, 0)
	for rows.Next() {
		sx := SnapshotInternal{}
		err = rows.Scan(&sx.UUID, &sx.created, &sx.appid, &sx.podid, &sx.envid, &sx.layid, &sx.link)
		if err != nil {
			log.Print("[DB/Snapshot] Scan", err)
		}
		sxs = append(sxs, &sx)
	}
	return sxs
}

func FromPod(db *sql.DB, p *models.Pod) []*SnapshotInternal {
	wh := fmt.Sprintf("WHERE podid = \"%d\"", p.ID)
	return list(db, &wh)
}

func (s *SnapshotInternal) ToResponse(db *sql.DB, flamescope string) *models.Snapshot {
	if s == nil {
		return nil
	}
	p := ""
	e := ""
	if db != nil {
		p = pod.FromId(db, s.podid).Name
		e = *environ.FromId(db, s.envid).Name
	}
	r := models.Snapshot{
		UUID:           &s.UUID,
		CreatedAt:      strfmt.DateTime(s.created),
		Pod:            p,
		Environment:    e,
		FlamescopeLink: url.PathEscape(flamescope + s.link),
	}
	return &r
}

func getSS(pvmountp *string, temporald *string, link *string, pname *string) (string, string, error) {
	/* try access to the "perf.tar.gz" file for extract */
	g, eg := http.Get(*link)
	if eg != nil || g.StatusCode != http.StatusOK {
		remo_msg := ""
		if eg == nil {
			msg, _ := ioutil.ReadAll(g.Body)
			remo_msg = string(msg)
		}
		log.Print("[Snapshot/error in retrieving]", eg, *link, g, remo_msg)
		return "", "", fmt.Errorf("Snapshot wasn't retrievable! Check mischo: err:%+v, link:%s", eg, *link)
	}
	defer g.Body.Close()
	log.Print("[Snapshot] Found perf archive for ", *pname)
	f, ef := ioutil.TempFile(*temporald, "SNPSCHT-"+*pname+"-")
	if ef != nil {
		log.Print("[Snapshot/error in TempFile]", ef)
		return "", "", fmt.Errorf("Temporal Snapshot file is failed to be created!: %+v", ef)
	}
	defer f.Close()
	/* Dump the response into tempfile instead of persistent volume not to save incomplete files. */
	_, ec := io.Copy(f, g.Body)
	if ec != nil {
		log.Print("[Snapshot/error in Saving]", ec)
		return "", "", fmt.Errorf("Snapshot wasn't saved even temporarily!: %+v", ef)
	}
	log.Print("[Snapshot] download OK at ", f.Name())

	uuid := uuid.New()
	/* midst byte is used for choosing directory-as-prefix.
	   This is better for human eyes because they tend to use first or last bytes for filtering.
	   Also note that the Node part is the _random_ part. */
	d := fmt.Sprintf("%s/%s/%x/", *pvmountp, *pname, uuid.NodeID()[3])
	/* ... and pave the path */
	os.MkdirAll(d, 0755)
	filename := uuid.String()

	er := os.Rename(f.Name(), d+filename)
	if er != nil {
		log.Print("[Snapshot/error] Saving to persistent volume failed:", d, "|||", f.Name(), ":::", er)
		return "", "", fmt.Errorf("Saving to persistent volume failed:", d, "|||", f.Name(), ":::", er)
	}
	log.Print("[Snapshot] data moved to ", d+filename)
	/* return relative path from persistent mount point */
	ret := fmt.Sprintf("%s/%x/%s", *pname, uuid.NodeID()[3], uuid.String())
	return uuid.String(), ret, nil
}

func New(extr *string, mount *string, tempd *string, db *sql.DB, a *models.App, p *models.Pod, l *layout.Layout) (*models.Snapshot, error) {
	k, err := url.Parse(pod.ToLogAddress(db, p.ID))
	if err != nil {
		return nil, err
	}
	link := *extr + "/?resource=" + k.Path + "perf-record/" + *a.Name + ".tar.gz"
	log.Printf("LINK ADDRESS: %s", link)
	g, loc, err := getSS(mount, tempd, &link, p.Name)
	if err != nil {
		log.Printf("[Snapshot] Couldn't get snapshot")
		return nil, err
	}
	log.Printf("[DB/Snapshot] Storing (%d @ %d: %s)", l.AppId, l.EnvId, g)
	t := time.Now()
	res, err := db.Exec("INSERT INTO snapshot(uuid, pvloc, appid, envid, podid, layid, created) values (?, ?, ?, ?, ?, ?, ?)",
		g, loc, l.AppId, l.EnvId, p.ID, l.Id, t)

	log.Printf("[DB/Snapshot] NEW: %+v, err: %s", res, err)

	if err != nil {
		return nil, err
	}
	ss := models.Snapshot{
		strfmt.DateTime(t),
		"",
		"",
		*p.Name,
		&g,
	}
	return &ss, nil
}
