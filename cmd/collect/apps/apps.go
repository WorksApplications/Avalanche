package app

import (
	"database/sql"
	"fmt"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"github.com/go-openapi/strfmt"
	"log"
	"time"
)

/* +--+----+---------------------------+
   |id|name|lastseen                   |
   +--+----+---------------------------+
*/

func InitTable(db *sql.DB) {
    res, err := db.Exec(
		"CREATE TABLE app(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(80) NOT NULL, " +
			"lastseen DATETIME, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println(res, err)
}

func list(db *sql.DB, where *string) []*models.App {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name, lastseen FROM app %s", *where))
	if err != nil {
		log.Fatal("APP", err)
	}
	defer rows.Close()
	apps := make([]*models.App, 0)
	for rows.Next() {
		var id int64
		var name string
		var date time.Time
		err = rows.Scan(&id, &name, &date)
		if err != nil {
			log.Print(err)
		}
		apps = append(apps, &models.App{nil, &id, strfmt.DateTime(date), &name})
	}
	return apps
}

func fill(s *models.App, db *sql.DB) {
    lays := layout.OfApp(*s.ID, db)
    envs := make([]*models.Environment, 0)
    for _, lay := range lays {
        envs = append(envs, environ.FromLayout(db, lay))
    }
	s.Environments = envs
}

func ListAll(db *sql.DB) []*models.App {
	apps := list(db, nil)
	for _, app := range apps {
		fill(app, db)
	}
	return apps
}

func Describe(db *sql.DB, n *string) *models.App {
	name := fmt.Sprintf("WHERE name = \"%s\"", *n)
    log.Println(fmt.Sprintf("%s", name))
	apps := list(db, &name)
	for _, app := range apps {
		fill(app, db)
	}
    if len(apps) != 0 {
        return apps[0]
    } else {
        return nil
    }
}
