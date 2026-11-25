"""Serve one offline python-build-standalone fixture to a packaged CLI on loopback.

Only the test child process trusts the temporary certificate. This server never
opens an outbound connection. Unknown hosts and paths receive an error.
"""
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import platform
import shutil
import ssl
import subprocess
import sys
import tarfile

root = Path(sys.argv[1]).resolve()
runtime = root / "python"
subprocess.run([sys.executable, "-m", "venv", "--without-pip", runtime], check=True)
windows = sys.platform == "win32"
if windows:
    shutil.copy2(runtime / "Scripts/python.exe", runtime / "python.exe")
target = "x86_64-pc-windows-msvc" if windows else "x86_64-unknown-linux-gnu"
name = f"cpython-{platform.python_version()}+20260914-{target}-install_only.tar.gz"
archive = root / name
with tarfile.open(archive, "w:gz") as tar:
    tar.add(runtime, arcname="python")
cert, key = root / "fixture.pem", root / "fixture.key"
subprocess.run(["openssl", "req", "-new", "-x509", "-newkey", "rsa:2048", "-nodes",
                "-days", "1", "-subj", "/CN=api.github.com",
                "-addext", "subjectAltName=DNS:api.github.com",
                "-addext", "basicConstraints=critical,CA:FALSE",
                "-keyout", key, "-out", cert], check=True, stderr=subprocess.DEVNULL)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(cert, key)
data = archive.read_bytes()
sums = f"{hashlib.sha256(data).hexdigest()}  {name}\n".encode()
release_path = "/repos/astral-sh/python-build-standalone/releases/latest"
assets = [{"name": n, "browser_download_url": f"https://api.github.com/fixture/{n}"}
          for n in [name, "SHA256SUMS"]]
responses = {release_path: json.dumps({"tag_name": "20260914", "assets": assets}).encode(),
             f"/fixture/{name}": data, "/fixture/SHA256SUMS": sums}


class Fixture(BaseHTTPRequestHandler):
    def do_CONNECT(self):
        if self.path != "api.github.com:443":
            return self.send_error(403)
        self.send_response_only(200, "Connection established")
        self.end_headers()
        with context.wrap_socket(self.connection, server_side=True) as tls:
            Fixture(tls, self.client_address, self.server)
        self.close_connection = True

    def do_GET(self):
        body = responses.get(self.path)
        if body is None or not isinstance(self.connection, ssl.SSLSocket):
            return self.send_error(404)
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


with ThreadingHTTPServer(("127.0.0.1", 0), Fixture) as server:
    port = root / "port.tmp"
    port.write_text(str(server.server_port))
    port.rename(root / "port")
    server.serve_forever()
