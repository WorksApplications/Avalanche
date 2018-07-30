package app

import (
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
    "github.com/go-openapi/strfmt"
    "database/sql"
    "time"
    "log"
    "fmt"
)

/* +--+----+---------------------------+
   |id|name|lastseen                   |
   +--+----+---------------------------+
 */

func InitTable(db *sql.DB) {
    row := db.QueryRow(
        "CREATE TABLE app(" +
            "id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
            "name CHAR(80) NOT NULL, " +
            "lastseen DATETIME, " +
            "PRIMARY KEY (id) " +
        ")")
    log.Println(row)
}

func list(db *sql.DB, where *string) []*models.App {
    rows, err := db.Query("SELECT id, name, lastseen FROM app ?", where)
    if err != nil {
        log.Fatal(err)
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
    idwhere := fmt.Sprintf("WHERE appId = %s", s.ID)
    s.Environments = environ.List(db, &idwhere)
}

func ListAll(db *sql.DB) []*models.App {
    apps := list(db, nil)
    for _,app := range apps {
        fill(app, db)
    }
    return apps
}

func Describe(db *sql.DB, n *string) *models.App {
    name := fmt.Sprintf("WHERE name = %s", n)
    apps := list(db, &name)
    for _,app := range apps {
        fill(app, db)
    }
    return apps[0]
}
