package app

import (
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/environments"
	"encoding/json"
    "database/sql"
    "time"
    "log"
    "fmt"
)

type App struct {
    id       int `json:"id"`
    name     string `json:"name"`
    envs     *[]environ.Env `json:"environments"`
    lastseen time.Time `json:"lastseen"`
}

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
    apps := make([]models.App, 0)
    for rows.Next() {
        var id int
        var name string
        var date time.Time
        err = rows.Scan(&id, &name, &date)
        if err != nil {
            log.Print(err)
        }
        apps = append(apps, models.App{id, name, nil, date})
    }
    return &apps
}

func (s *App) fill(db *sql.DB) {
    idwhere := fmt.Sprintf("WHERE appId = %s", s.id)
    s.envs = environ.List(db, &idwhere)
}

func ListAll(db *sql.DB) *Apps {
    apps := list(db, nil)
    for _,app := range *apps {
        app.fill(db)
    }
    a := Apps(*apps)
    return &a
}

func Describe(db *sql.DB, n *string) *models.App {
    name := fmt.Sprintf("WHERE name = %s", n)
    apps := list(db, &name)
    for _,app := range *apps {
        app.fill(db)
    }
    return &(*apps)[0]
}

type Apps []App

