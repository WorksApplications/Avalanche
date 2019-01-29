#!/bin/bash

mkdir -p ${PERF_DIR:=/tmp/perf}
mkdir $(dirname ${PERF_ARCHIVE_FILE})

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

if [[ "$(basename $1)" == "java" ]]; then
    javaCmd=$1
    shift
    ${javaCmd} "-XX:+PreserveFramePointer" $@
else
    if [[ "$(file $1 | grep "text" | wc -l)" == "1" ]]; then
        # XXX: GNU
        sed -i 's/java /java -XX:+PreserveFramePointer /g' $1
        $@ &
    else
        echo Non-text entry point is not supported by our logger
        exit 1
    fi
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

PID=$(ps ax|grep java|grep catalina|grep -v grep|awk '{print $1}')
e=$(echo perf record --switch-output=1m -o ${PERF_DIR}/perf.data -F ${PERF_RECORD_FREQ:=99} -g -p ${PID} -m ${PERF_MMAP_N_PAGES:=32})
echo $e
$e &

# start archiving
archive-perf-data &
wait ${ENTRY_PID}
exit $?
