"""
Read and validate deploy/site.env, the committed site identity.

Used by deploy.sh, the server helpers, the edge registration and the GitHub
workflows, so they all agree on one set of values:

    python3 scripts/site_config.py               # validate, print a summary
    python3 scripts/site_config.py --shell       # KEY=value lines for bash
    python3 scripts/site_config.py --github-output  # step outputs in Actions

Standard library only: it runs on a fresh VPS and in CI before any install.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_FILE = ROOT / "deploy/site.env"

HOSTNAME = re.compile(
    r"^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$"
)
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
NAMESPACE = re.compile(r"^ghcr\.io/[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9._-]*$")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PLACEHOLDER_DOMAINS = ("example.com", "example.org", "example.net")

KNOWN_KEYS = {
    "APP_NAME",
    "APP_SLUG",
    "SITE_DOMAIN",
    "SITE_ALIASES",
    "LETSENCRYPT_EMAIL",
    "DEPLOY_DIR",
    "EDGE_HTTP_PORT",
    "EDGE_HTTPS_PORT",
    "IMAGE_NAMESPACE",
    "MEDIA_HOST",
}


class SiteConfigError(ValueError):
    pass


@dataclass(frozen=True)
class Site:
    app_name: str
    app_slug: str
    domain: str
    aliases: tuple[str, ...]
    letsencrypt_email: str
    deploy_dir: str
    edge_http_port: int
    edge_https_port: int
    image_namespace: str
    media_host: str
    warnings: tuple[str, ...] = field(default=())

    @property
    def url(self) -> str:
        return f"https://{self.domain}"

    @property
    def hostnames(self) -> tuple[str, ...]:
        return (self.domain, *self.aliases)

    def shell(self) -> dict[str, str]:
        """Values for deploy.sh and Compose, all derived ones included."""

        return {
            "APP_NAME": self.app_name,
            "APP_SLUG": self.app_slug,
            "SITE_DOMAIN": self.domain,
            "SITE_ALIASES": ",".join(self.aliases),
            "SITE_URL": self.url,
            "LETSENCRYPT_EMAIL": self.letsencrypt_email,
            "DEPLOY_DIR": self.deploy_dir,
            "EDGE_HTTP_PORT": str(self.edge_http_port),
            "EDGE_HTTPS_PORT": str(self.edge_https_port),
            "IMAGE_NAMESPACE": self.image_namespace,
            "MEDIA_HOST": self.media_host,
        }


def read_values(path: Path = SITE_FILE) -> dict[str, str]:
    if not path.is_file():
        raise SiteConfigError(f"{path.name} is missing; create it from the starter's deploy/site.env.")

    values: dict[str, str] = {}

    for number, raw in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = raw.strip()

        if not line or line.startswith("#"):
            continue

        key, separator, value = line.partition("=")
        key, value = key.strip(), value.strip()

        if not separator or key not in KNOWN_KEYS:
            raise SiteConfigError(f"site.env line {number}: unknown setting {key!r}.")

        if key in values:
            raise SiteConfigError(f"site.env: {key} is set twice.")

        # Compose, bash and Python must all read the same literal value.
        if any(char in value for char in "$`\"'\\") or " #" in value:
            raise SiteConfigError(f"site.env: {key} must be a plain unquoted value.")

        values[key] = value

    return values


def namespace_from_git(root: Path = ROOT) -> str:
    """ghcr.io/<owner>/<repo>, from the origin remote, or empty."""

    try:
        remote = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""

    match = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?/?$", remote)

    return f"ghcr.io/{match.group(1)}/{match.group(2)}".lower() if match else ""


def parse(values: dict[str, str], *, strict: bool, git_root: Path | None = ROOT) -> Site:
    """
    Validate the values. `strict` also refuses placeholders, for anything
    that is about to touch a real server.
    """

    errors: list[str] = []
    warnings: list[str] = []

    def get(key: str) -> str:
        return values.get(key, "").strip()

    app_name = get("APP_NAME")
    if not app_name or len(app_name) > 80:
        errors.append("APP_NAME: set a display name of up to 80 characters.")

    slug = get("APP_SLUG")
    if not SLUG.fullmatch(slug):
        errors.append("APP_SLUG: use 1-63 lowercase letters, numbers or hyphens.")

    domain = get("SITE_DOMAIN").lower()
    if not HOSTNAME.fullmatch(domain):
        errors.append("SITE_DOMAIN: use a hostname such as mysite.com, without https:// or a path.")

    aliases = tuple(
        alias.strip().lower() for alias in get("SITE_ALIASES").split(",") if alias.strip()
    )
    for alias in aliases:
        if not HOSTNAME.fullmatch(alias):
            errors.append(f"SITE_ALIASES: {alias!r} is not a hostname.")
    if domain in aliases or len(set(aliases)) != len(aliases):
        errors.append("SITE_ALIASES: list each other hostname once, without SITE_DOMAIN.")

    email = get("LETSENCRYPT_EMAIL")
    if email and not EMAIL.fullmatch(email):
        errors.append("LETSENCRYPT_EMAIL: use an email address.")

    deploy_dir = get("DEPLOY_DIR")
    if not deploy_dir.startswith("/") or ".." in deploy_dir.split("/") or deploy_dir.rstrip("/") in ("", "/srv"):
        errors.append("DEPLOY_DIR: use an absolute path such as /srv/my-site.")

    ports: list[int] = []
    for key in ("EDGE_HTTP_PORT", "EDGE_HTTPS_PORT"):
        try:
            port = int(get(key))
            if not 1024 <= port <= 65535:
                raise ValueError
            ports.append(port)
        except ValueError:
            errors.append(f"{key}: use a port between 1024 and 65535.")
            ports.append(0)
    if ports[0] and ports[0] == ports[1]:
        errors.append("EDGE_HTTP_PORT and EDGE_HTTPS_PORT must differ.")

    namespace = get("IMAGE_NAMESPACE").lower()
    if not namespace and git_root is not None:
        namespace = namespace_from_git(git_root)
    if namespace and not NAMESPACE.fullmatch(namespace):
        errors.append("IMAGE_NAMESPACE: use ghcr.io/<owner>/<repository>.")

    media_host = get("MEDIA_HOST").lower()
    if media_host and not HOSTNAME.fullmatch(media_host.split(":")[0]):
        errors.append("MEDIA_HOST: use a hostname without a scheme or path.")

    if strict:
        if any(domain == placeholder or domain.endswith("." + placeholder) for placeholder in PLACEHOLDER_DOMAINS):
            errors.append("SITE_DOMAIN: replace the example domain with the real one.")
        if not email:
            errors.append("LETSENCRYPT_EMAIL: set the address that receives certificate expiry notices.")
        if not namespace:
            errors.append("IMAGE_NAMESPACE: set it, or give the checkout a GitHub origin remote.")
    elif not email:
        warnings.append("LETSENCRYPT_EMAIL is empty; it is required before the first deployment.")

    if errors:
        raise SiteConfigError("deploy/site.env is not valid:\n- " + "\n- ".join(errors))

    return Site(
        app_name=app_name,
        app_slug=slug,
        domain=domain,
        aliases=aliases,
        letsencrypt_email=email,
        deploy_dir=deploy_dir.rstrip("/"),
        edge_http_port=ports[0],
        edge_https_port=ports[1],
        image_namespace=namespace,
        media_host=media_host,
        warnings=tuple(warnings),
    )


def load(path: Path = SITE_FILE, *, strict: bool = False) -> Site:
    return parse(read_values(path), strict=strict, git_root=path.resolve().parents[1])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--file", type=Path, default=SITE_FILE)
    parser.add_argument("--strict", action="store_true", help="refuse placeholders (for real deployments)")
    output = parser.add_mutually_exclusive_group()
    output.add_argument("--shell", action="store_true", help="print KEY=value lines for bash")
    output.add_argument("--github-output", action="store_true", help="append step outputs in GitHub Actions")
    args = parser.parse_args()

    try:
        site = load(args.file, strict=args.strict)
    except SiteConfigError as exc:
        sys.exit(str(exc))

    if args.shell:
        for key, value in site.shell().items():
            print(f"{key}={value}")
    elif args.github_output:
        target = os.environ.get("GITHUB_OUTPUT")
        if not target:
            sys.exit("GITHUB_OUTPUT is not set; this option is for GitHub Actions.")
        with open(target, "a", encoding="utf-8") as stream:
            for key, value in site.shell().items():
                stream.write(f"{key.lower()}={value}\n")
    else:
        for warning in site.warnings:
            print(f"warning: {warning}", file=sys.stderr)
        print(f"{site.app_name} ({site.app_slug}) at {site.url}")
        if site.aliases:
            print(f"  redirects: {', '.join(site.aliases)}")
        print(f"  server checkout: {site.deploy_dir}")
        print(f"  edge ports: 127.0.0.1:{site.edge_http_port} (HTTP), 127.0.0.1:{site.edge_https_port} (HTTPS)")
        print(f"  images: {site.image_namespace or '(set IMAGE_NAMESPACE or a GitHub origin remote)'}")


if __name__ == "__main__":
    main()
