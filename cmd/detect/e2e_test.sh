#!/bin/bash

echo //////////// GET just after run ////////////


function check() {
    echo == $1: /$2 ==
    res=$(curl -X $1 http://localhost:8080/$2 -s)
    if [[ "$res" == "$3" ]]; then
        echo OK
    else
        echo $res
    fi
}

check GET subscription "[]"
check GET subscription/ "[]"
check GET subscription/jilll "[]"

