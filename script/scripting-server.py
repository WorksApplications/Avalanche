from __future__ import print_function
from flask import Flask, Response, make_response, request
import re
import time
import random
import string
import urllib2
import os
import subprocess
import tarfile
import logging
import sys

app = Flask(__name__)

@app.route("/")
def scriptor():
    def analyzer(files):
        files.sort()
        for fil in files:
            if fil.endswith(".map") or fil.endswith(".data"):
                continue
            script = subprocess.check_output(["perf", "script", "-i", "/" + fil])
            yield script
        
    def gen_temp():
        return ''.join([ random.choice(string.ascii_letters) for _ in range(12) ])

    def validate_tarfile(temporal_file):
        if tarfile.is_tarfile(temporal_file):
            print("valid archive", file=sys.stdout)
            return True
        else:
            print("broken archive", file=sys.stdout)
            return False

    def download_perf_archive(temporal_file):
        print("archive will be ", temporal_file, file=sys.stdout)
        content = open(temporal_file, "wb")
        content.write(worker.read())
        content.close()
        assert validate_tarfile(temporal_file), "Archive is broken"

    perf_map_regex = re.compile(r'^perf[0-9]+\.map$')
    server = request.args.get('server')
    if not server:
        return 'specify server name', status.HTTP_400_BAD_REQUEST
    res = request.args.get('resource')
    location = server + res
    print(location, file=sys.stdout)
    temporal_file = gen_temp()
    try:
        worker = urllib2.urlopen(location)
        download_perf_archive(temporal_file)

    except urllib2.HTTPError as e:
        return make_response(e.reason, 503)
        
    perf_tar = tarfile.open(temporal_file, 'r')
    while len(filter(perf_map_regex.match, perf_tar.getnames())):
        """ map with same name is here! """
        print("lock!", file=sys.stdout)
        """ do nothing while he alives """
        time.sleep(0.3)

    perf_tar.extractall('/')
    return Response(analyzer(perf_tar.getnames()), mimetype='text/plain')

if __name__ == "__main__":
    app.debug = True
    app.logger.addHandler(logging.StreamHandler(stream=sys.stderr))
    app.logger.setLevel(logging.INFO)
    app.run(threaded=True, host='0.0.0.0')
