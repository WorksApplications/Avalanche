package pod

import (
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"github.com/go-openapi/strfmt"
	"database/sql"
	"log"
	"time"
	"fmt"
)

type SnapSummary struct {
	id         int       `json:"id"`
	created_at time.Time `json:"created_at"`
}

func InitTable(db *sql.DB) {
	db.QueryRow(
		"CREATE TABLE pod(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(128) NOT NULL, " +
			"appid int, " +
			"envid int, " +
            "layid int, " +
			"live boolean, " +
            "created DATETIME, " +
			"PRIMARY KEY (id) " +
			")")
}

func list(db *sql.DB, where *string) *[]*models.Pod {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, appid, envid, layid, live, created FROM pod %s", *where))
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	pods := make([]*models.Pod, 0)
	for rows.Next() {
		var id int64
		var name string
		var appid int64
		var envid int64
		var layid int64
        var created time.Time
		var live bool
		err = rows.Scan(&id, &name, &appid, &envid, &layid, &live, &created)
		if err != nil {
			log.Print(err)
		}
		pods = append(pods, &models.Pod{strfmt.DateTime(created), live, &name, nil})
	}
	return &pods
}

func fill(s *models.Pod, db *sql.DB) {
}

func ListAll(db *sql.DB) *[]*models.Pod {
	pods := list(db, nil)
	for _, pod := range *pods {
		fill(pod, db)
	}
	return pods 
}

func Describe(db *sql.DB, n *string) *models.Pod {
	name := fmt.Sprintf("WHERE name = %s", n)
	pods := list(db, &name)
	for _, pod := range *pods {
		fill(pod, db)
	}
	return (*pods)[0]
}

func FromLayout(db *sql.DB, lay *layout.Layout) *[]*models.Pod {
	where := fmt.Sprintf("WHERE layid = %s", lay.Id)
	pods := list(db, &where)
	for _, pod := range *pods {
		fill(pod, db)
	}
	return pods
}
