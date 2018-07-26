package detectService

import (
	"log"
	"net/http"
	//"strings"
	"./crowler"
)

type HandlerClosure struct {
    ch chan *crowl.ScannerRequest
}

func (s handlerClosure) Runner(res http.ResponseWriter, req *http.Request) {
}


