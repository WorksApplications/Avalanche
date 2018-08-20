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

type Environ struct {
	Id          int64   `json:"id"`
	Name        string  `json:"name"`
	Addr        *string `json:"address,omitempty"`
	Kubeapi     *string `json:"kubernetes_api"`
	Multitenant *bool   `json:"multitenant,omitempty"`
	Version     *string `json:"version,omitempty"`
	Observe     bool    `json:"observe"`
}

func InitTable(db *sql.DB) {
	res, err := db.Exec(
		"CREATE TABLE environ(" +
			"id MEDIUMINT NOT NULL AUTO_INCREMENT, " +
			"name CHAR(32) NOT NULL, " +
			"addr TEXT, " +
			"kubeapi TEXT, " +
			"multitenant BOOLEAN, " +
			"version TEXT, " +
			"observe BOOLEAN, " +
			"PRIMARY KEY (id) " +
			")")
	log.Println("[DB/Env]", res, err)
}

func ListConfig(db *sql.DB, name *string, obs *bool) []*Environ {
	namew := ""
	obsw := ""
	if name != nil {
		namew = "namew = " + *name
	}
	if obs != nil {
		obsw = fmt.Sprintf("observe = %t", obs)
	}
	where := ""
	if name != nil || obs != nil {
		where = "where " + namew + obsw
	}

	rows, err := db.Query("SELECT id, name, kubeapi, multitenant, version, observe FROM environ " + where)
	if err != nil {
		log.Fatal("[DB/Env/Detect] ", err)
	}
	defer rows.Close()
	envs := make([]*Environ, 0)
	for rows.Next() {
		var ret Environ
		err = rows.Scan(&ret.Id, &ret.Name, ret.Kubeapi, ret.Multitenant, ret.Version, &ret.Observe)
		if err != nil {
			log.Println("[DB/Env/Detect] Scan ", err)
		}
		envs = append(envs, &ret)
	}
	return envs
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
			log.Println("[DB/Env] Scan ", err)
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

func ListAll(db *sql.DB) []*models.Environment {
	where := ""
	return list(db, &where)
}

func Get(db *sql.DB, n *string) *models.Environment {
	name := fmt.Sprintf("WHERE name = \"%s\"", *n)
	envs := list(db, &name)
	if len(envs) != 0 {
		return envs[0]
	} else {
		return nil
	}
}

func Add(db *sql.DB, e *Environ) {
	/*
	   Id          int64
	   Name        string
	   Addr        *string
	   Kubeapi     *string
	   Multitenant *bool
	   Version     *string
	   Observe     bool
	*/
	log.Printf("[DB/Env] Storing %#v\n", e)
	db.Query("INSERT INTO environ(name, kubeapi, multitenant, version, observe) values (?, ?, ?, ?, ?)",
		e.Name, e.Kubeapi, e.Multitenant, e.Version, e.Observe)
}

func Update(db *sql.DB, e *Environ) {
	log.Printf("[DB/Env] Update %#v\n", e)
	db.Query("UPDATE environ set kubeapi = ?, multitenant = ?, version = ?, observe = ? where name = ?",
		e.Kubeapi, e.Multitenant, e.Version, e.Observe, e.Name)
}

func Assign(db *sql.DB, e *string) *models.Environment {
	g := Get(db, e)
	/*
		if g == nil {
			Add(db, e, nil)
			g = Get(db, e)
		}
	*/
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

/* XXX Why it doesn't fill? */
func FromId(db *sql.DB, id int64) *models.Environment {
	wh := fmt.Sprintf("WHERE id = \"%d\"", id)
	envs := list(db, &wh)
	if len(envs) == 0 {
		return nil
	}
	return envs[0]
}
