"""Read-only deployment gate. Exit nonzero on any failed contract."""
import argparse
import json
import shutil
import subprocess
import time
from pathlib import Path
from urllib.parse import urlsplit

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--site", required=True)
parser.add_argument("--api", required=True)
parser.add_argument("--local-validation", action="store_true")
args = parser.parse_args()
extra = []
if args.local_validation:
    assert args.site == "https://starter.test:8446" and args.api == "https://starter.test:8446"
    extra = ["--cacert", str(Path(__file__).resolve().parent / "e2e/generated/fullchain.pem"),
             "--resolve", "starter.test:8446:127.0.0.1", "--noproxy", "*"]
for base in (args.site, args.api):
    if urlsplit(base).scheme != "https":
        parser.error("Smoke checks require HTTPS")
checks = [(args.site + "/", None), (args.site + "/login", None),
          (args.api + "/health/", "status"), (args.api + "/health/ready/", "checks"),
          (args.api + "/api/schema/?format=json", "paths"),
          (args.api + "/static/admin/css/base.css", None)]
failed = []
for url, field in checks:
    for attempt in range(3):
        start = time.monotonic()
        result = subprocess.run([shutil.which("curl"), "--silent", "--show-error", "--fail", "--max-time", "15",
                                 "--write-out", "\n%{http_code}", *extra, url], capture_output=True, text=True)
        body, _, status = result.stdout.rpartition("\n")
        try:
            valid = result.returncode == 0 and status == "200" and bool(body)
            if field:
                data = json.loads(body)
                valid = valid and field in data
                if field == "checks": valid = valid and all(data[field].values())
                if field == "paths": valid = valid and "/api/v1/auth/login/" in data[field]
        except (ValueError, TypeError):
            valid = False
        if valid: break
        if attempt < 2: time.sleep(2)
    print(json.dumps({"url": url, "passed": valid, "status": status, "seconds": round(time.monotonic()-start, 2)}))
    if not valid: failed.append(url)

if failed:
    raise SystemExit("Deployment gate failed: restore the previous application images; follow docs/DEPLOYMENT.md before any database rollback.")
print("Deployment smoke passed")
