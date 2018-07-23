from flask import Flask, Response, make_response
import re
import random
import string
import urllib2
import os
import subprocess
import tarfile

app = Flask(__name__)

@app.route("/")
def dummy():
    return "<h1>THIS IS <i>SCRIPTING SERVER</i></h1> <h2>that generates perf-script from specified perf-map on mischo</h2>"

@app.route("/<mischo_url>")
def scriptor(mischo_url):
    def analyzer(files):
        files.sort()
        for fil in files:
            script = subprocess.check_output(["perf", "script", "-i", fil])
            yield script
        
    def gen_temp():
        return ''.join([ random.choice(string.ascii_letters) for _ in range(12) ])

    def validate_tarfile(temporal_file):
        return tarfile.is_tarfile(temporal_file)

    def download_perf_archive(temporal_file):
        content = open(temporal_file, "wb")
        content.write(worker.read())
        content.close()
        assert validate_tarfile(temporal_file), "Archive is broken"

    perf_map_regex = re.compile(r'^perf[0-9]+\.map$')
    location = 'http://mischo.internal.worksap.com/' + mischo_url
    temporal_file = gen_temp()
    try:
        worker = urllib2.urlopen(location)
        download_perf_archive(temporal_file)

    except urllib2.HTTPError as e:
        return make_response(e.reason, 404)
        
    perf_tar = tarfile.open(temporal_file, 'r')
    while len(filter(perf_map_regex.match, perf_tar.getnames())):
        """ map with same name is here! """
        """ do nothing while he alives """

    perf_tar.extractall('/tmp')
    return Response(analyzer(perf_tar.getnames()), mimetype='text/plain')

if __name__ == "__main__":
    app.debug = True
    app.run()
