"""
Prepare this checkout on the server for its first deployment.

    python3 scripts/server.py init-env   # write backend/.env.production
    python3 scripts/server.py doctor     # check everything a release needs
    python3 scripts/server.py github     # the GitHub settings to enter

Run as the deploy user, inside the checkout (DEPLOY_DIR in deploy/site.env).
The server itself is prepared once by infra/server/bootstrap.sh.
docs/DEPLOYMENT.md walks through the order.

Standard library only: it runs before anything else is installed.
"""

from __future__ import annotations

import argparse
import getpass
import ipaddress
import json
import os
import re
import secrets
import shutil
import socket
import stat
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from production_env import check_file, read_environment  # noqa: E402
from site_config import SITE_FILE, Site, SiteConfigError, load  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "backend/.env.production.example"
TARGET = ROOT / "backend/.env.production"

# FRONTEND_REVALIDATE_SECRET is shared by Django and Next.js (compose passes
# it to the frontend as REVALIDATE_SECRET), so admin edits show up at once.
GENERATED = ("SECRET_KEY", "JWT_SIGNING_KEY", "POSTGRES_PASSWORD", "REDIS_PASSWORD", "FRONTEND_REVALIDATE_SECRET")

MIN_COMPOSE = (2, 24, 4)


# ==============================================================================
# init-env
# ==============================================================================


def site_values(site: Site) -> dict[str, str]:
    """Everything in the secrets file that deploy/site.env already decides."""

    underscored = site.app_slug.replace("-", "_")

    values = {
        "APP_NAME": site.app_name,
        "APP_SLUG": site.app_slug,
        # Aliases are redirected by nginx and never reach Django.
        "ALLOWED_HOSTS": f"{site.domain},web",
        "FRONTEND_URL": site.url,
        "NEXT_PUBLIC_SITE_URL": site.url,
        "CORS_ALLOWED_ORIGINS": site.url,
        "CSRF_TRUSTED_ORIGINS": site.url,
        "API_SERVER_URL": site.url,
        "POSTGRES_DB": underscored,
        "POSTGRES_USER": underscored,
        "CACHE_KEY_PREFIX": site.app_slug,
    }

    if site.media_host:
        values["MEDIA_HOST"] = site.media_host

    return values


# (key, question, default factory, hidden, pattern)
def questions(site: Site) -> list[tuple[str, str, str | None, bool, str]]:
    return [
        ("EMAIL_HOST", "SMTP server", "smtp-relay.brevo.com", False, r"[A-Za-z0-9.-]+"),
        ("EMAIL_PORT", "SMTP port (587 STARTTLS)", "587", False, r"\d{2,5}"),
        ("EMAIL_HOST_USER", "SMTP login", None, False, r"\S+"),
        ("EMAIL_HOST_PASSWORD", "SMTP password or key (hidden)", None, True, r"\S+"),
        ("DEFAULT_FROM_EMAIL", "Send site emails from", f"no-reply@{site.domain}", False, r"[^@\s]+@[^@\s]+\.[^@\s]+"),
        ("ADMIN_EMAIL", "Administrator email (error reports)", site.letsencrypt_email or None, False, r"[^@\s]+@[^@\s]+\.[^@\s]+"),
        ("BACKUP_BUCKET", "Private backup bucket name", f"{site.app_slug}-backups", False, r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]"),
        ("BACKUP_ACCESS_KEY_ID", "Backup access key ID", None, False, r"\S+"),
        ("BACKUP_SECRET_ACCESS_KEY", "Backup secret access key (hidden)", None, True, r"\S+"),
        ("BACKUP_ENDPOINT_URL", "Backup endpoint (R2: https://<account-id>.r2.cloudflarestorage.com)", None, False, r"https://\S+"),
    ]


def ask(question: str, default: str | None, hidden: bool, pattern: str) -> str:
    prompt = f"{question}{f' [{default}]' if default else ''}: "

    while True:
        value = (getpass.getpass(prompt) if hidden else input(prompt)).strip() or (default or "")

        if re.fullmatch(pattern, value) and not any(char in value for char in "\"'#\\$` "):
            return value

        print("  That doesn't look right; try again (no quotes, spaces, $ or #).")


def set_key(lines: list[str], key: str, value: str) -> None:
    """Replace `KEY=…` or a commented `# KEY=…` line; append if absent."""

    pattern = re.compile(rf"^\s*#?\s*{re.escape(key)}=")

    for index, line in enumerate(lines):
        if pattern.match(line):
            lines[index] = f"{key}={value}"
            return

    lines.append(f"{key}={value}")


def init_env(force: bool) -> None:
    site = load(SITE_FILE, strict=True)

    if TARGET.exists() and not force:
        sys.exit(
            "backend/.env.production already exists. Edit it, or rerun with --force "
            "to answer the questions again (generated secrets are kept)."
        )

    # --force keeps the generated secrets of an existing file. A new
    # POSTGRES_PASSWORD would lock the app out of a database created with
    # the old one, and a new SECRET_KEY or JWT_SIGNING_KEY would sign
    # everyone out; only the outside-service answers are asked again.
    previous = read_environment(TARGET) if TARGET.exists() else {}

    lines = EXAMPLE.read_text(encoding="utf-8").splitlines()

    for key, value in site_values(site).items():
        set_key(lines, key, value)

    for key in GENERATED:
        kept = previous.get(key, "")
        set_key(lines, key, kept if kept and "CHANGE_ME" not in kept else secrets.token_urlsafe(48))

    print(f"Settings for {site.url} come from deploy/site.env, and the signing keys and")
    print("passwords are generated. Only the outside services are asked for:\n")

    for key, question, default, hidden, pattern in questions(site):
        set_key(lines, key, ask(question, previous.get(key) if hidden is False and previous.get(key) else default, hidden, pattern))

    values = dict(
        line.split("=", 1) for line in lines if "=" in line and not line.lstrip().startswith("#")
    )
    if values.get("R2_BUCKET_NAME") and values["R2_BUCKET_NAME"] == values.get("BACKUP_BUCKET"):
        sys.exit("The backup bucket must be private and separate from the public media bucket.")

    TARGET.touch(mode=0o600, exist_ok=True)
    TARGET.chmod(0o600)
    TARGET.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nWrote backend/.env.production (readable by {getpass.getuser()} only).")

    try:
        check_file(TARGET, require_backup=True, site=site)
        print("All required values are set. Next: python3 scripts/server.py doctor")
    except ValueError as exc:
        print(f"\n{exc}\nEdit backend/.env.production to finish, then run the doctor.")


# ==============================================================================
# doctor
# ==============================================================================


class Report:
    def __init__(self) -> None:
        self.failures = 0
        self.warnings = 0

    def ok(self, message: str) -> None:
        print(f"  ok    {message}")

    def warn(self, message: str, hint: str = "") -> None:
        self.warnings += 1
        print(f"  warn  {message}")
        if hint:
            print(f"        {hint}")

    def fail(self, message: str, hint: str = "") -> None:
        self.failures += 1
        print(f"  FAIL  {message}")
        if hint:
            print(f"        {hint}")


def run(*args: str, timeout: int = 30) -> subprocess.CompletedProcess:
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, stdin=subprocess.DEVNULL)


def local_addresses() -> set[str]:
    """Addresses configured on this machine's interfaces."""

    addresses: set[str] = set()

    try:
        output = run("ip", "-o", "addr", "show").stdout
    except (OSError, subprocess.TimeoutExpired):
        return addresses

    for match in re.finditer(r"\binet6?\s+([0-9a-fA-F:.]+)/", output):
        try:
            address = ipaddress.ip_address(match.group(1))
        except ValueError:
            continue
        if address.is_global:
            addresses.add(str(address))

    return addresses


def resolve(hostname: str) -> set[str]:
    try:
        return {info[4][0] for info in socket.getaddrinfo(hostname, 443, proto=socket.IPPROTO_TCP)}
    except socket.gaierror:
        return set()


def check_dns(report: Report, site: Site) -> None:
    mine = local_addresses()

    for hostname in site.hostnames:
        found = resolve(hostname)

        if not found:
            report.fail(f"{hostname} does not resolve", "Add an A record pointing at this server.")
        elif not mine:
            report.warn(f"{hostname} resolves to {', '.join(sorted(found))}; could not list this server's addresses to compare")
        elif found & mine == found:
            report.ok(f"{hostname} -> {', '.join(sorted(found))} (this server)")
        elif found & mine:
            stray = ", ".join(sorted(found - mine))
            report.fail(
                f"{hostname} also resolves to {stray}, which is not this server",
                "Remove that record (often a stale AAAA); visitors and certificate checks reach it at random.",
            )
        else:
            report.fail(
                f"{hostname} resolves to {', '.join(sorted(found))}, not this server ({', '.join(sorted(mine))})",
                "Point the A record here. Behind Cloudflare, use DNS only (grey cloud) until the certificate exists.",
            )


def compose_version() -> tuple[int, ...] | None:
    try:
        output = run("docker", "compose", "version", "--short").stdout.strip().lstrip("v")
    except (OSError, subprocess.TimeoutExpired):
        return None

    match = re.match(r"(\d+)\.(\d+)\.(\d+)", output)
    return tuple(int(part) for part in match.groups()) if match else None


def doctor() -> int:
    report = Report()

    print("Site")
    try:
        site = load(SITE_FILE, strict=True)
        report.ok(f"deploy/site.env: {site.url}, edge ports {site.edge_http_port}/{site.edge_https_port}")
    except SiteConfigError as exc:
        report.fail(str(exc).replace("\n", "\n        "))
        return 1

    if Path.cwd().resolve() != Path(site.deploy_dir).resolve() and ROOT.resolve() != Path(site.deploy_dir).resolve():
        report.warn(f"this checkout is {ROOT}, but DEPLOY_DIR is {site.deploy_dir}", "GitHub deploys cd into DEPLOY_DIR.")

    print("\nServer")
    if os.geteuid() == 0:
        report.warn("running as root", "Use the deploy user created by infra/server/bootstrap.sh.")

    version = compose_version()
    if version is None:
        report.fail("Docker Compose is not available", "Run infra/server/bootstrap.sh, then sign in again.")
    elif version < MIN_COMPOSE:
        report.fail(f"Docker Compose {'.'.join(map(str, version))} is older than 2.24.4")
    else:
        report.ok(f"Docker Compose {'.'.join(map(str, version))}")

    if run("docker", "info").returncode != 0:
        report.fail("this user cannot use Docker", "Add it to the docker group and sign in again.")

    for tool in ("git", "flock", "curl"):
        if not shutil.which(tool):
            report.fail(f"{tool} is not installed")

    free = shutil.disk_usage(ROOT).free / 1024**3
    (report.ok if free >= 10 else report.warn)(f"{free:.0f} GB free disk", "Images, dumps and scratch restores need room.")

    swaps = Path("/proc/swaps")
    if swaps.exists() and len(swaps.read_text().splitlines()) < 2:
        report.warn("no swap", "A memory spike will kill containers instead of slowing them (bootstrap.sh adds swap).")

    print("\nGitHub access")
    fetch = run("git", "ls-remote", "--exit-code", "origin", "refs/heads/main", timeout=30)
    if fetch.returncode == 0:
        report.ok("the checkout can fetch main")
    else:
        report.fail("cannot fetch from origin", "Add the server's deploy key to the repository (docs/DEPLOYMENT.md).")

    docker_config = Path.home() / ".docker/config.json"
    try:
        auths = json.loads(docker_config.read_text()).get("auths", {}) if docker_config.exists() else {}
    except ValueError:
        auths = {}
    if "ghcr.io" in auths:
        report.ok("signed in to ghcr.io")
    else:
        report.warn(
            "not signed in to ghcr.io",
            "Private images need: docker login ghcr.io (a token with read:packages only).",
        )

    print("\nSecrets")
    if not TARGET.exists():
        report.fail("backend/.env.production is missing", "python3 scripts/server.py init-env")
    else:
        mode = stat.S_IMODE(TARGET.stat().st_mode)
        if mode & 0o077:
            report.fail(f"backend/.env.production is readable by others ({oct(mode)})", "chmod 600 backend/.env.production")
        try:
            check_file(TARGET, require_backup=True, site=site)
            report.ok("backend/.env.production is complete and matches deploy/site.env")
        except ValueError as exc:
            report.fail(str(exc).replace("\n", "\n        "))

    print("\nDNS")
    check_dns(report, site)

    print("\nEdge")
    edge = Path(os.environ.get("EDGE_DIR", "/srv/edge"))
    if not edge.exists():
        report.warn(f"{edge} does not exist yet", "The first deploy installs it; bootstrap.sh makes it writable.")
    elif not os.access(edge, os.W_OK):
        report.fail(f"{edge} is not writable by this user", f"sudo chown -R {getpass.getuser()} {edge}")
    else:
        # Port and hostname conflicts with the other sites, without writing.
        from edge import registered  # noqa: PLC0415

        others = registered(edge / "sites", exclude=site.app_slug) if (edge / "sites").exists() else {}
        clashes = [
            route for routes in others.values() for route in routes
            if route.hostname in site.hostnames or route.port in (site.edge_http_port, site.edge_https_port)
        ]
        if clashes:
            route = clashes[0]
            report.fail(
                f"{route.hostname} or port {route.port} already belongs to '{route.owner}'",
                "Choose another EDGE_HTTP_PORT/EDGE_HTTPS_PORT pair in deploy/site.env.",
            )
        else:
            report.ok("no other site uses this site's names or ports")

    listening = run("ss", "-ltn").stdout if shutil.which("ss") else ""
    for port in (80, 443):
        if re.search(rf"[:.]{port}\s", listening):
            report.ok(f"port {port} is in use (the edge, once installed)")
            break
    else:
        if listening:
            report.ok("ports 80 and 443 are free for the edge")

    print()
    if report.failures:
        print(f"{report.failures} problem(s) to fix before deploying.")
        return 1

    print("Ready to deploy." + (f" ({report.warnings} warning(s) above.)" if report.warnings else ""))
    return 0


# ==============================================================================
# github
# ==============================================================================


def host_fingerprint() -> str:
    """
    The ECDSA host key fingerprint.

    The deploy action's SSH client prefers ECDSA over Ed25519, so an Ed25519
    fingerprint fails with "host key fingerprint mismatch".
    """

    key = Path("/etc/ssh/ssh_host_ecdsa_key.pub")

    if not key.exists():
        return "(no ECDSA host key: run ssh-keygen -A as root)"

    output = run("ssh-keygen", "-lf", str(key), "-E", "sha256").stdout.split()
    return output[1] if len(output) > 1 else "(could not read the host key)"


def public_address() -> str:
    addresses = sorted(local_addresses(), key=lambda value: ":" in value)
    return addresses[0] if addresses else "(this server's public IP)"


def github(create_key: bool) -> None:
    site = load(SITE_FILE, strict=True)
    user = getpass.getuser()

    key_path = Path.home() / ".ssh/github_actions"
    if create_key and not key_path.exists():
        key_path.parent.mkdir(mode=0o700, exist_ok=True)
        subprocess.run(
            ["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-C", f"github-actions-{site.app_slug}", "-f", str(key_path)],
            check=True,
        )
        authorized = key_path.parent / "authorized_keys"
        with authorized.open("a", encoding="utf-8") as stream:
            stream.write(key_path.with_suffix(".pub").read_text(encoding="utf-8"))
        authorized.chmod(0o600)
        print(f"Created {key_path} and allowed it to sign in as {user}.\n")

    rows = [
        ("VPS_HOST", public_address()),
        ("VPS_USER", user),
        ("VPS_HOST_FINGERPRINT", host_fingerprint()),
        ("VPS_SSH_KEY", f"the private key: cat {key_path}" if key_path.exists()
         else "a private key allowed in ~/.ssh/authorized_keys (rerun with --create-key to make one)"),
    ]

    print(f"GitHub settings for {site.url}\n")
    print("Settings → Environments → New environment 'production' → Environment secrets:")
    for name, value in rows:
        print(f"  {name:<22} {value}")

    print("\nSettings → Secrets and variables → Actions → Variables:")
    print("  ENABLE_RELEASES        true   (publish images after the tests pass)")
    print("  ENABLE_DEPLOYMENTS     true   (after the first manual deploy works)")
    print("\nEverything else (site URL, server path, app name, media host) is read")
    print("from deploy/site.env, so it needs no GitHub setting.")

    if key_path.exists():
        print(f"\nOnce VPS_SSH_KEY is saved in GitHub, delete the private key here: rm {key_path}")

    if shutil.which("gh"):
        print("\nWith the GitHub CLI signed in, the variables can be set from here:")
        print("  gh variable set ENABLE_RELEASES --body true")


# ==============================================================================


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)

    init = sub.add_parser("init-env", help="write backend/.env.production")
    init.add_argument("--force", action="store_true", help="answer again; generated secrets are kept")

    sub.add_parser("doctor", help="check everything a release needs")

    hub = sub.add_parser("github", help="print the GitHub settings to enter")
    hub.add_argument("--create-key", action="store_true", help="create a key for GitHub Actions to sign in with")

    args = parser.parse_args()

    if os.name == "nt":
        sys.exit("Run this on the Linux server, inside the checkout.")

    try:
        if args.command == "init-env":
            init_env(args.force)
        elif args.command == "doctor":
            sys.exit(doctor())
        else:
            github(args.create_key)
    except SiteConfigError as exc:
        sys.exit(str(exc))
    except (KeyboardInterrupt, EOFError):
        sys.exit("\nStopped; nothing was written.")


if __name__ == "__main__":
    main()
