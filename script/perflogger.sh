#!/bin/bash

mkdir -p ${PERF_DIR:=/tmp/perf}
mkdir -p $(dirname ${PERF_ARCHIVE_FILE:=${PERF_ARCHIVE_FILE_DEFAULT}})

archive-perf-data () {
  while true; do
    cd ${PERF_DIR}
    inotifywait ${PERF_DIR} -e create
    find ${PERF_DIR} -name "perf.data.*" -cmin +20 -delete
    /usr/bin/perf-map-agent/bin/create-java-perf-map.sh ${PID}
    tar czf /tmp/$(basename ${PERF_ARCHIVE_FILE}) -C /tmp /tmp/perf/* /tmp/perf-*.map --exclude=/tmp/perf/perf.data
    echo copying archive
    cp /tmp/$(basename ${PERF_ARCHIVE_FILE}) ${PERF_ARCHIVE_FILE}
  done
}

if [[ "$(basename $1)" == "$(basename ${TARGETPROC})" ]]; then # I believe this is not a coincidence
    javaCmd=$1
    shift
    ${javaCmd} "-XX:+PreserveFramePointer" $@
else
    if [[ "$1" == "/bin/bash" || "$1" == "/bin/sh" || "$(basename $(dirname $1))/$(basename $1)" == "bin/zsh" ]]; then
        shift
        if [[ $1 == "-c" ]]; then
            shift
        fi
    fi
    sed -i "s/\(^.*$(basename ${TARGETPROC})\) /\1 -XX:+PreserveFramePointer /g" $1
    $@ &
fi
ENTRY_PID=$!

# Wait for the process to come up
while true; do
    PID=$(ps ax|grep ${TARGETPROC}|grep -v grep|awk '{print $1}')
    if [ "${PID}" ]; then
        break
    fi
    sleep 1
done

PID=$(ps ax|grep ${TARGETPROC}|grep -v grep|awk '{print $1}')
e=$(echo perf record --switch-output=1m -o ${PERF_DIR}/perf.data -F ${PERF_RECORD_FREQ:=99} -g -p ${PID} -m ${PERF_MMAP_N_PAGES:=32})
echo $e
$e &

# start archiving
archive-perf-data &
wait ${ENTRY_PID}
exit $?
