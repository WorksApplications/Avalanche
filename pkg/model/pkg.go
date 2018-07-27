package model

type Subscription struct {
	Env  string
	Apps []App
}

type App struct {
	Name string `json:"name"`
	Pods []Pod  `json:"pods"`
}

type Pod struct {
	Name    string `json: "name"`
	Link    string `json: "link"`
	Perfing bool   `json: "perfing"`
	//node string
	//namespace string
}

