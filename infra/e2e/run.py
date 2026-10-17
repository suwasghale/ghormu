"""Build and exercise production images in the fixed, isolated validation project."""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPOSE = ["docker", "compose", "--project-name", "ghormu-e2e", "--env-file",
           "infra/e2e/generated/test.env", "-f", "docker-compose.prod.yml", "-f", "infra/e2e/compose.yml"]

def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, **kwargs)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--skip-build", action="store_true")
parser.add_argument("--keep-running", action="store_true")
args = parser.parse_args()
run([sys.executable, "infra/e2e/prepare.py"])
try:
    run(COMPOSE + ["stop", "backup-scheduler"])
    if not args.skip_build:
        run(COMPOSE + ["build", "web", "frontend", "backup"])
    # Recreate isolated containers so regenerated single-file nginx mounts and
    # network endpoints cannot survive from a previous validation run.
    run(COMPOSE + ["up", "-d", "--no-build", "--force-recreate", "--wait", "--wait-timeout", "240"])
    run(COMPOSE + ["restart", "frontend", "nginx"])
    run(COMPOSE + ["exec", "-T", "web", "python", "manage.py", "check", "--deploy", "--fail-level", "WARNING"])
    run(COMPOSE + ["exec", "-T", "web", "python", "/fixtures/seed.py"])
    run([sys.executable, "infra/smoke.py", "--site", "https://starter.test:8446",
         "--api", "https://starter.test:8446", "--local-validation"])
    pnpm = shutil.which("pnpm")
    if not pnpm:
        raise RuntimeError("Install the package manager declared in frontend/package.json")
    subprocess.run([pnpm, "exec", "playwright", "test"], cwd=ROOT / "frontend", check=True)
    # The scheduler is healthy only after a real off-host dump and scratch restore.
    run(COMPOSE + ["up", "-d", "--no-build", "--wait", "--wait-timeout", "180", "backup-scheduler"])
except (subprocess.CalledProcessError, RuntimeError):
    subprocess.run(COMPOSE + ["ps", "-a"], cwd=ROOT)
    subprocess.run(COMPOSE + ["logs", "--tail", "100"], cwd=ROOT)
    raise
finally:
    # Preserve volumes for inspection. Never delete or target another Compose project.
    if not args.keep_running:
        subprocess.run(COMPOSE + ["--profile", "backup-scheduler", "down"], cwd=ROOT, check=True)
