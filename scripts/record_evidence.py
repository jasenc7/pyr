"""Write the acceptance mapping after a successful CI job, for its actual checkout."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys

lane, package = sys.argv[1:]
requirements = json.loads(Path("trace.json").read_text())["requirements"]
sha = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
digest = hashlib.sha256(Path(package).read_bytes()).hexdigest()
lines = [f"### Automated candidate verification on {platform.system()} {platform.machine()}",
         "", f"Commit `{sha}`, package `{Path(package).name}`, SHA-256 `{digest}`.", ""]
for req in requirements:
    if lane in req["lanes"]:
        cases = [c for c in req["cases"] if lane == "windows" or not c.endswith("(Windows)")]
        lines.append(f"- {req['id']} passed. README step {req['walkthrough'][0]}. " + " / ".join(cases))
report = "\n".join(lines) + "\n"
print(report)
if "GITHUB_STEP_SUMMARY" in os.environ:
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as out:
        out.write(report)
