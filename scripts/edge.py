"""
Manage the shared edge that owns ports 80 and 443 on the server.

    python3 scripts/edge.py ensure      # install or upgrade, register, start
    python3 scripts/edge.py status      # what is registered, and is it up
    python3 scripts/edge.py unregister  # remove this site's routes

The edge lives in /srv/edge (EDGE_DIR), outside every checkout. This site's
routes come from deploy/site.env and are written to
/srv/edge/sites/<slug>.https.map and <slug>.http.map, so adding a site never
means editing another site's files. deploy.sh runs `ensure` on every release.

An edge installed by hand before this tool existed (no "# sg-edge" marker)
is migrated: its routes become site files and its config is kept beside the
new one as nginx.conf.legacy-<time>. docs/EDGE.md.

Standard library only; it runs on the server before anything is installed.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from site_config import Site, SiteConfigError, load  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "infra/edge"
MARKER = re.compile(r"^# sg-edge v(\d+)\s*$", re.MULTILINE)
ROUTE = re.compile(r"^\s*([a-z0-9.*-]+)\s+127\.0\.0\.1:(\d+)\s*;", re.MULTILINE)


class EdgeError(RuntimeError):
    pass


@dataclass(frozen=True)
class Route:
    hostname: str
    port: int
    owner: str


def edge_dir() -> Path:
    return Path(os.environ.get("EDGE_DIR", "/srv/edge"))


def version(text: str) -> int | None:
    match = MARKER.search(text)
    return int(match.group(1)) if match else None


# ------------------------------------------------------------------------------
# Reading routes
# ------------------------------------------------------------------------------


def map_block(text: str, variable: str) -> str:
    """The body of `map ... $variable { ... }`, or empty."""

    match = re.search(r"map\s+\S+\s+\$" + re.escape(variable) + r"\s*\{(.*?)\}", text, re.DOTALL)
    return match.group(1) if match else ""


def routes_in(text: str, owner: str) -> list[Route]:
    return [
        Route(hostname=hostname, port=int(port), owner=owner)
        for hostname, port in ROUTE.findall(text)
        if hostname != "default"
    ]


def registered(directory: Path, *, exclude: str = "") -> dict[str, list[Route]]:
    """Routes in every site file, by protocol, except `exclude`'s own."""

    found: dict[str, list[Route]] = {"https": [], "http": []}

    for protocol in found:
        for path in sorted(directory.glob(f"*.{protocol}.map")):
            owner = path.name[: -len(f".{protocol}.map")]
            if owner == exclude:
                continue
            found[protocol].extend(routes_in(path.read_text(encoding="utf-8"), owner))

    return found


# ------------------------------------------------------------------------------
# Install, upgrade, migrate
# ------------------------------------------------------------------------------


def write_atomic(path: Path, text: str) -> None:
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(text, encoding="utf-8")
    os.replace(temporary, path)


def migrate_legacy(directory: Path, text: str) -> list[str]:
    """
    Turn a hand-written edge config's routes into site files.

    Routes are grouped by their HTTPS port: one group per site. A group's
    file is named after its first hostname, so the existing sites keep
    working exactly as before and show up in `status`.
    """

    https = routes_in(map_block(text, "https_site"), "legacy")
    http = {route.hostname: route.port for route in routes_in(map_block(text, "http_site"), "legacy")}

    groups: dict[int, list[str]] = {}
    for route in https:
        groups.setdefault(route.port, []).append(route.hostname)

    written = []
    for port, hostnames in groups.items():
        name = "legacy-" + re.sub(r"[^a-z0-9-]+", "-", hostnames[0].removeprefix("www.")).strip("-")
        header = f"# Migrated from the hand-written edge config on {time.strftime('%Y-%m-%d')}.\n"
        write_atomic(
            directory / "sites" / f"{name}.https.map",
            header + "".join(f"{host} 127.0.0.1:{port};\n" for host in hostnames),
        )
        http_lines = [f"{host} 127.0.0.1:{http[host]};\n" for host in hostnames if host in http]
        write_atomic(directory / "sites" / f"{name}.http.map", header + "".join(http_lines))
        written.append(name)

    return written


def install(directory: Path) -> str:
    """Install the edge files, upgrading or migrating an existing edge."""

    (directory / "sites").mkdir(parents=True, exist_ok=True)

    source_config = (SOURCE / "nginx.conf").read_text(encoding="utf-8")
    source_version = version(source_config)
    target = directory / "nginx.conf"

    if not target.exists():
        action = "installed"
    else:
        current = target.read_text(encoding="utf-8")
        installed = version(current)

        if installed is None:
            backup = directory / f"nginx.conf.legacy-{time.strftime('%Y%m%d%H%M%S')}"
            shutil.copy2(target, backup)
            migrated = migrate_legacy(directory, current)
            action = f"migrated ({', '.join(migrated) or 'no routes found'}; old config kept as {backup.name})"
        elif source_version is not None and installed < source_version:
            action = f"upgraded from v{installed} to v{source_version}"
        else:
            action = "unchanged"

    if action != "unchanged":
        write_atomic(target, source_config)
        write_atomic(directory / "compose.yml", (SOURCE / "compose.yml").read_text(encoding="utf-8"))

    return action


# ------------------------------------------------------------------------------
# Registering a site
# ------------------------------------------------------------------------------


def register(directory: Path, site: Site) -> None:
    others = registered(directory / "sites", exclude=site.app_slug)

    for protocol, port in (("https", site.edge_https_port), ("http", site.edge_http_port)):
        for route in others[protocol]:
            if route.hostname in site.hostnames:
                raise EdgeError(
                    f"{route.hostname} is already routed to the site '{route.owner}'. "
                    f"Remove it there first (scripts/edge.py unregister in that checkout)."
                )
            if route.port in (site.edge_http_port, site.edge_https_port):
                raise EdgeError(
                    f"Port {route.port} already belongs to the site '{route.owner}'. "
                    f"Choose another EDGE_HTTP_PORT/EDGE_HTTPS_PORT pair in deploy/site.env."
                )

    header = f"# {site.app_slug}: written by scripts/edge.py from deploy/site.env. Do not edit.\n"
    for protocol, port in (("https", site.edge_https_port), ("http", site.edge_http_port)):
        write_atomic(
            directory / "sites" / f"{site.app_slug}.{protocol}.map",
            header + "".join(f"{host} 127.0.0.1:{port};\n" for host in site.hostnames),
        )


def unregister(directory: Path, site: Site) -> None:
    for protocol in ("https", "http"):
        (directory / "sites" / f"{site.app_slug}.{protocol}.map").unlink(missing_ok=True)


# ------------------------------------------------------------------------------
# Docker
# ------------------------------------------------------------------------------


def compose(directory: Path, *args: str, check: bool = True, capture: bool = False):
    return subprocess.run(
        ["docker", "compose", "-f", str(directory / "compose.yml"), *args],
        check=check,
        stdin=subprocess.DEVNULL,
        capture_output=capture,
        text=True,
    )


def running(directory: Path) -> bool:
    result = compose(directory, "ps", "--status", "running", "-q", "nginx", check=False, capture=True)
    return bool(result.stdout.strip())


def apply(directory: Path, *, recreate: bool = False) -> None:
    """
    Validate the configuration, then start or reload the edge.

    `recreate` after the edge's own files changed: nginx.conf is mounted as a
    single file, which a running container keeps reading by its old inode,
    and an edge from before this tool did not mount sites/ at all. Reloading
    either would quietly drop every route.
    """

    if running(directory) and not recreate:
        test = compose(directory, "exec", "-T", "nginx", "nginx", "-t", check=False, capture=True)
        if test.returncode != 0:
            raise EdgeError("The edge rejected the new routes; nothing was reloaded:\n" + test.stderr)
        compose(directory, "exec", "-T", "nginx", "nginx", "-s", "reload")
        return

    try:
        compose(directory, "up", "-d", *(["--force-recreate"] if recreate else []), "--wait", "--wait-timeout", "60")
    except subprocess.CalledProcessError as exc:
        raise EdgeError(
            "The edge did not start. If ports 80 or 443 are taken, a site from before the "
            "edge is still listening on them (ss -ltnp | grep -E ':(80|443) '); its next "
            "release moves it behind the edge. docs/EDGE.md."
        ) from exc


# ------------------------------------------------------------------------------
# Commands
# ------------------------------------------------------------------------------


def status(directory: Path) -> None:
    if not (directory / "nginx.conf").exists():
        print(f"No edge at {directory}. Run: python3 scripts/edge.py ensure")
        return

    installed = version((directory / "nginx.conf").read_text(encoding="utf-8"))
    print(f"Edge at {directory}: {'v' + str(installed) if installed else 'hand-written (not migrated)'}, "
          f"{'running' if running(directory) else 'NOT running'}")

    routes = registered(directory / "sites")
    owners = sorted({route.owner for protocol in routes.values() for route in protocol})
    for owner in owners:
        https = [route for route in routes["https"] if route.owner == owner]
        http = [route for route in routes["http"] if route.owner == owner]
        names = ", ".join(route.hostname for route in https) or "(no HTTPS names)"
        ports = f"{http[0].port if http else '-'}/{https[0].port if https else '-'}"
        print(f"  {owner:<24} {ports:<12} {names}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("command", choices=["ensure", "status", "unregister"])
    parser.add_argument("--no-docker", action="store_true", help="write files only (for tests)")
    args = parser.parse_args()

    directory = edge_dir()

    try:
        if args.command == "status":
            status(directory)
            return

        site = load(strict=True)

        if args.command == "unregister":
            unregister(directory, site)
            if not args.no_docker:
                apply(directory)
            print(f"{site.app_slug} removed from the edge.")
            return

        action = install(directory)
        register(directory, site)
        if not args.no_docker:
            apply(directory, recreate=action != "unchanged")
        print(f"Edge {action}; {site.domain} routed to 127.0.0.1:{site.edge_http_port}/{site.edge_https_port}.")
    except (EdgeError, SiteConfigError, PermissionError) as exc:
        sys.exit(f"edge: {exc}")


if __name__ == "__main__":
    main()
