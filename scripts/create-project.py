"""Copy this starter into a fresh project without secrets, dependencies or data."""
import argparse
from pathlib import Path
import re
import shutil
import subprocess
import sys

EXCLUDED_NAMES = {
    ".git", ".deployment", ".tools", ".venv", "node_modules", ".next", "__pycache__",
    ".pytest_cache", ".ruff_cache", ".pnpm-store", ".coverage", "coverage.xml", "htmlcov",
    "test-results", "playwright-report", ".ssh", ".aws", ".terraform", ".vercel",
    ".npmrc", ".pypirc", ".netrc", "secrets.env", "credentials.json",
}
RUNTIME_PATHS = {"infra/e2e/generated", "infra/nginx/certs", "backend/media", "backend/staticfiles", "backend/logs", "backups"}
PRIVATE_SUFFIXES = (".pyc", ".tsbuildinfo", ".dump", ".dump.gz", ".sqlite3", ".log", ".pem", ".key", ".p12", ".pfx", ".tfstate", ".tfstate.backup", ".credentials.json")


def project_slug(name):
    if not name.strip() or any(ord(char) < 32 for char in name) or any(char in name for char in "$#") or name.startswith(("'", '\"')):
        raise ValueError("Use a display name without control characters, leading quotes, $ or #.")
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not slug or len(slug) > 63:
        raise ValueError("The project name must produce a slug of 1–63 letters, numbers or hyphens.")
    return slug


def copy_project(source, target, name):
    source, target = source.resolve(), target.resolve()
    name = name.strip()
    slug = project_slug(name)
    if target.exists() or target.is_relative_to(source):
        raise ValueError("Choose a new directory outside the starter.")

    def ignore(directory, names):
        omitted = []
        for entry in names:
            path = Path(directory) / entry
            relative = path.relative_to(source).as_posix()
            private = entry.startswith(".env") and not entry.endswith(".example")
            if (entry in EXCLUDED_NAMES or relative in RUNTIME_PATHS or private
                    or entry.lower().endswith(PRIVATE_SUFFIXES) or path.is_symlink() or path.is_junction()):
                omitted.append(entry)
        return omitted

    shutil.copytree(source, target, ignore=ignore)
    for file in [".env.example", "backend/.env.example", "frontend/.env.example", "backend/.env.production.example"]:
        path = target / file
        text = path.read_text(encoding="utf-8").replace("SG Starter", name).replace("sg-starter", slug).replace("sg_starter", slug.replace("-", "_"))
        path.write_text(text, encoding="utf-8")
    subprocess.run([sys.executable, target / "scripts/tasks.py", "bootstrap"], cwd=target, check=True)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    try:
        target = copy_project(Path(__file__).resolve().parents[1], args.destination, args.name)
    except ValueError as exc:
        parser.error(str(exc))
    print(f"Created {target}. Update ports in .env before running alongside another project.")


if __name__ == "__main__":
    main()
