package environ

import (
	"database/sql"
	"fmt"
	"log"

	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/layout"
	"git.paas.workslan/resource_optimization/dynamic_analysis/cmd/collect/pod"
	"git.paas.workslan/resource_optimization/dynamic_analysis/generated_files/models"
)

/* +--+----+---------------------------+
   |id|name|app_id                     |
   +--+----+---------------------------+
*/
func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE environ(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(32) NOT NULL, " +
			"addr TEXT, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Env]", res, err)
}

func list(db *sql.DB, where *string) []*models.Environment {
	rows, err := db.Query(fmt.Sprintf("SELECT id, name FROM environ %s", *where))
	if err != nil {
		log.Fatal("[DB/Env] ", err)
	}
	defer rows.Close()
	envs := make([]*models.Environment, 0)
	for rows.Next() {
		var id int64
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			log.Println("[DB/Env] Scan", err)
		}
		envs = append(envs, &models.Environment{&id, 0, &name, nil})
	}
	return envs
}

func fill(db *sql.DB, s *models.Environment, lay *layout.Layout) {
	var lays []*layout.Layout
	if lay == nil {
		lays = layout.OfEnv(db, s)
	} else {
		lays = make([]*layout.Layout, 1)
		lays[0] = lay
	}
	lsum := 0
	pods := make([]*models.Pod, 0)
	for _, l := range lays {
		lsum = lsum + int(l.Lives)
		ps := pod.FromLayout(db, l)
        log.Print(l, ps)
		rs := make([]*models.Pod, len(ps))
        /* XXX assert is_live if it is really alive XXX */
		for i, p := range ps {
			rs[i] = p.ToResponse()
		}
		pods = append(pods, rs...)
	}
    s.Pods = pods
	s.LiveCount = int64(lsum)
}

/*
func ListAll(db *sql.DB) []*models.Environment {
	where := ""
	envs := list(db, &where)
	for _, env := range envs {
		fill(db, env, nil)
	}
	return envs
}
*/

func Get(db *sql.DB, n *string) *models.Environment {
	name := fmt.Sprintf("WHERE name = \"%s\"", *n)
	envs := list(db, &name)
	if len(envs) != 0 {
		return envs[0]
	} else {
		return nil
	}
}

func add(db *sql.DB, e *string) {
	log.Printf("[DB/Env] Storing %s\n", e)
	db.Query("INSERT INTO environ(name) values (?)", e)
}

/*
func Describe(db *sql.DB, n *string) *models.Environment {
	g := Get(db, n)
	if g != nil {
		fill(db, g, nil)
	}
	return g
}
*/

func Assign(db *sql.DB, e *string) *models.Environment {
	g := Get(db, e)
	if g == nil {
		add(db, e)
		g = Get(db, e)
	}
	return g
}

func FromLayout(db *sql.DB, lay *layout.Layout) *models.Environment {
	where := fmt.Sprintf("WHERE id = \"%d\"", lay.EnvId)
	envs := list(db, &where)
	for _, env := range envs {
		fill(db, env, lay)
	}
	if len(envs) != 0 {
		return envs[0]
	} else {
		return nil
	}
}

func FromId(db *sql.DB, id int64) *models.Environment {
	wh := fmt.Sprintf("WHERE id = \"%d\"", id)
	envs := list(db, &wh)
	if len(envs) == 0 {
		return nil
	}
	return envs[0]
}
