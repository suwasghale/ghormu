"""
Copy this starter into a fresh project without secrets, dependencies or data.

    python scripts/create-project.py ../my-site --name "My Site" \\
        --domain mysite.com --repo owner/my-site --email you@mysite.com

The copy is ready to develop and to deploy: deploy/site.env names the site,
its loopback ports for the shared edge are chosen from the project name so
they do not collide with other sites, and local development gets its own
ports so several projects can run side by side.
"""

import argparse
from pathlib import Path
import re
import shutil
import subprocess
import sys
import zlib

EXCLUDED_NAMES = {
    ".git", ".deployment", ".tools", ".venv", "node_modules", ".next", "__pycache__",
    ".pytest_cache", ".ruff_cache", ".pnpm-store", ".coverage", "coverage.xml", "htmlcov",
    "test-results", "playwright-report", ".ssh", ".aws", ".terraform", ".vercel",
    ".npmrc", ".pypirc", ".netrc", "secrets.env", "credentials.json",
}
RUNTIME_PATHS = {"infra/e2e/generated", "infra/nginx/certs", "backend/media", "backend/staticfiles", "backend/logs", "backups"}
PRIVATE_SUFFIXES = (".pyc", ".tsbuildinfo", ".dump", ".dump.gz", ".sqlite3", ".log", ".pem", ".key", ".p12", ".pfx", ".tfstate", ".tfstate.backup", ".credentials.json")
ENV_EXAMPLES = [".env.example", "backend/.env.example", "frontend/.env.example", "backend/.env.production.example"]

HOSTNAME = re.compile(r"^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$")
REPOSITORY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9._-]+$")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# The starter's own development ports, and the bands a copy's ports come from.
DEV_PORTS = {"3010": 3000, "8010": 8000, "5440": 5400, "6390": 6300, "8030": 9000}


def project_slug(name):
    if not name.strip() or any(ord(char) < 32 for char in name) or any(char in name for char in "$#") or name.startswith(("'", '\"')):
        raise ValueError("Use a display name without control characters, leading quotes, $ or #.")
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not slug or len(slug) > 63:
        raise ValueError("The project name must produce a slug of 1–63 letters, numbers or hyphens.")
    return slug


def edge_ports(slug):
    """A loopback port pair for the shared edge, stable for a given slug."""

    base = 21000 + (zlib.crc32(slug.encode()) % 4000) * 2
    return base, base + 1


def dev_ports(slug):
    """Development ports, shifted by the same amount for every service."""

    step = (zlib.crc32(b"dev:" + slug.encode()) % 80 + 2) * 10
    return {old: str(band + step) for old, band in DEV_PORTS.items()}


def site_env(source_text, *, name, slug, domain, repo, email):
    values = {
        "APP_NAME": name,
        "APP_SLUG": slug,
        "DEPLOY_DIR": f"/srv/{slug}",
    }
    values["EDGE_HTTP_PORT"], values["EDGE_HTTPS_PORT"] = (str(port) for port in edge_ports(slug))
    if domain:
        values["SITE_DOMAIN"] = domain
        # An apex domain gets www as a redirect; a subdomain gets none.
        values["SITE_ALIASES"] = f"www.{domain}" if domain.count(".") == 1 else ""
    if repo:
        values["IMAGE_NAMESPACE"] = f"ghcr.io/{repo.lower()}"
    if email:
        values["LETSENCRYPT_EMAIL"] = email

    lines = []
    for line in source_text.splitlines():
        key = line.split("=", 1)[0]
        lines.append(f"{key}={values[key]}" if "=" in line and not line.startswith("#") and key in values else line)
    return "\n".join(lines) + "\n"


def copy_project(source, target, name, *, domain="", repo="", email=""):
    source, target = source.resolve(), target.resolve()
    name = name.strip()
    slug = project_slug(name)
    domain = domain.strip().lower().removeprefix("https://").removeprefix("http://").rstrip("/")
    if target.exists() or target.is_relative_to(source):
        raise ValueError("Choose a new directory outside the starter.")
    if domain and not HOSTNAME.fullmatch(domain):
        raise ValueError("Use a domain such as mysite.com, without a path.")
    if repo and not REPOSITORY.fullmatch(repo):
        raise ValueError("Use the GitHub repository as owner/name.")
    if email and not EMAIL.fullmatch(email):
        raise ValueError("Use an email address for certificate notices.")

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

    ports = dev_ports(slug)
    for file in ENV_EXAMPLES:
        path = target / file
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8").replace("Ghormu", name).replace("ghormu", slug).replace("ghormu", slug.replace("-", "_"))
        if file != "backend/.env.production.example":
            for old, new in ports.items():
                text = re.sub(rf"(?<![0-9]){old}(?![0-9])", new, text)
        path.write_text(text, encoding="utf-8", newline="\n")

    site_file = target / "deploy/site.env"
    if site_file.exists():
        text = site_env(site_file.read_text(encoding="utf-8"), name=name, slug=slug, domain=domain, repo=repo, email=email)
        site_file.write_text(text, encoding="utf-8", newline="\n")

    subprocess.run([sys.executable, target / "scripts/tasks.py", "bootstrap"], cwd=target, check=True)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("destination", type=Path)
    parser.add_argument("--name", required=True, help='display name, e.g. "My Site"')
    parser.add_argument("--domain", default="", help="the site's hostname, e.g. mysite.com")
    parser.add_argument("--repo", default="", help="GitHub repository, e.g. owner/my-site")
    parser.add_argument("--email", default="", help="address for Let's Encrypt expiry notices")
    args = parser.parse_args()
    try:
        target = copy_project(Path(__file__).resolve().parents[1], args.destination, args.name,
                              domain=args.domain, repo=args.repo, email=args.email)
    except ValueError as exc:
        parser.error(str(exc))
    slug = project_slug(args.name)
    print(f"Created {target}.")
    print(f"  Local: http://localhost:{dev_ports(slug)['3010']} (python scripts/tasks.py dev)")
    http, https = edge_ports(slug)
    print(f"  Server: /srv/{slug}, edge ports {http}/{https}")
    if not (args.domain and args.email):
        print("  Before deploying, set SITE_DOMAIN and LETSENCRYPT_EMAIL in deploy/site.env.")
    print("  Deployment: docs/DEPLOYMENT.md")


if __name__ == "__main__":
    main()
