package detect

import (
	"time"
)

type Subscription struct {
	Env  string `json:"environment"`
	Apps []App  `json:"apps"`
}

type App struct {
	Name string    `json:"name"`
	Pods []Pod     `json:"pods"`
	Seen time.Time `json:"last_seen"`
}

type Pod struct {
	Name    string `json: "name"`
	Link    string `json: "link"`
	Perfing bool   `json: "perfing"`
	//node string
	//namespace string
}
