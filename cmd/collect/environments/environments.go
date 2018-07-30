package environ

import (
    "database/sql"
    "time"
    "log"
)

type Env struct {
    id   int `json:"id"`
    name string `json:"name"`
    pods *[]Pod `json:"pods"`
    live int `json:"live_count"`
}

type Pod struct {
    id         int `json:"id"`
    name       string `json:"name"`
    snapshots  *[]SnapSummary `json:"snapshots"`
    is_live    bool `json:"is_live"`
    created_at time.Time `json:"created_at"`
}

type SnapSummary struct {
    id         int `json:"id"`
    created_at time.Time `json:"created_at"`
}

/* +--+----+---------------------------+
   |id|name|app_id                     |
   +--+----+---------------------------+
 */
func InitTable(db *sql.DB) {
    db.QueryRow(
        "CREATE TABLE environ(" +
            "id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
            "name CHAR(32) NOT NULL, " +
            "appId int, " +
            "lives int, " +
            "PRIMARY KEY (id) " +
        ")")
}

func List(db *sql.DB, where *string) *[]Env {
    rows, err := db.Query("SELECT id, name, appId, lives FROM environ ?", where)
    if err != nil {
        log.Fatal(err)
    }
    defer rows.Close()
    envs := make([]Env, 0)
    for rows.Next() {
        var id int
        var name string
        var appId int
        var lives int
        err = rows.Scan(&id, &name, &appId, &lives)
        if err != nil {
            log.Print(err)
        }
        envs = append(envs, Env{id, name, nil, lives})
    }
    return &envs
}

func (s *Env) fill() {
    // fill pod infos
}

func ListAll(db *sql.DB) *[]Env {
    env := List(db, nil)
    for _,env := range *env {
        env.fill()
    }
    return env 
}

