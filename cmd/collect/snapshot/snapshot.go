package snapshot

import (
	"database/sql"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
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
			"pvloc CHAR(80), " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Snapshot]", res, err)
}

func getSS(pvmountp *string, link *string, pname *string) string {
	g, eg := http.Get(*link)
	if g.StatusCode != http.StatusOK || eg != nil {
		log.Print("[Snapshot/error in retrieving]", eg, *link, g)
		return ""
	}
	defer g.Body.Close()
	f, ef := ioutil.TempFile("/tmp", "SNPSCHT-"+*pname+"-")
	if ef != nil {
		log.Print("[Snapshot/error in TempFile]", ef)
		return ""
	}
	defer f.Close()
	/* Dump the response into tempfile instead of persistent volume not to save incomplete files. */
	_, ec := io.Copy(f, g.Body)
	if ec != nil {
		log.Print("[Snapshot/error in Saving]", ec)
		return ""
	}
	log.Print("[Snapshot] download OK at ", f.Name())

	uuid := uuid.New()
	/* midst byte is used for choosing directory-as-prefix.
	   This is better for human eyes because they tend to use first or last bytes for filtering.
	   Also note that the Node part is the _random_ part. */
	d := fmt.Sprintf("%s/%x/", *pvmountp, uuid.NodeID()[3])

	er := os.Rename(f.Name(), d+uuid.String())
	if er != nil {
		log.Print("[Snapshot/error] Saving to persistent volume failed", d, f.Name(), er)
	}
	return uuid.String()
}

/*

	// created at
	// Format: date-time
	CreatedAt strfmt.DateTime `json:"created_at,omitempty"`

	// is live
	IsLive bool `json:"is_live,omitempty"`

	// name
	// Required: true
	// Min Length: 4
	Name *string `json:"name"`

	// snapshots
	Snapshots []*SnapshotSummary `json:"snapshots"`
	Id    int64
	AppId int64
	EnvId int64
	Lives int64

	// created at
	// Format: date-time
	CreatedAt strfmt.DateTime `json:"created_at,omitempty"`

	// environment
	Environment string `json:"environment,omitempty"`

	// flamescope link
	FlamescopeLink string `json:"flamescope_link,omitempty"`

	// pod
	Pod string `json:"pod,omitempty"`

	// uuid
	// Required: true
	// Max Length: 36
	// Min Length: 36
	UUID *string `json:"uuid"`
*/

func New(m *string, db *sql.DB, p *models.Pod, l *layout.Layout) models.Snapshot {
	log.Printf("[DB/Snapshot] Storing (%d @ %d: %d)", l.AppId, l.EnvId)
	k := pod.ToLogAddress(db, p.ID)
	g := getSS(m, &k, p.Name)
	/* Fuck you */
	t := time.Now()
	log.Println("Fuck you", t)
	db.QueryRow("INSERT INTO snapshot(name, pvloc, appid, envid, layid) values (?, ?, ?, ?, ?)", p.Name, g, l.AppId, l.EnvId, l.Id)
	return models.Snapshot{
		strfmt.DateTime(t),
		"",
		"",
		*p.Name,
		&g,
	}
}
