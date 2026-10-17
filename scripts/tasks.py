"""Cross-platform project commands. Run: python scripts/tasks.py --help."""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import secrets
import subprocess
import sys
from datetime import datetime, timezone
from production_env import check_file

ROOT = Path(__file__).resolve().parents[1]


def run(args, *, cwd=ROOT, **kwargs):
    return subprocess.run([str(x) for x in args], cwd=cwd, check=True, **kwargs)


def bootstrap():
    for example, target in [(".env.example", ".env"), ("backend/.env.example", "backend/.env"),
                            ("frontend/.env.example", "frontend/.env.local")]:
        path = ROOT / target
        if path.exists():
            print(f"Keeping {target}")
            continue
        text = (ROOT / example).read_text(encoding="utf-8")
        if target == "backend/.env":
            text = text.replace("# SECRET_KEY=", "SECRET_KEY=" + secrets.token_urlsafe(64))
            text = text.replace("# JWT_SIGNING_KEY=", "JWT_SIGNING_KEY=" + secrets.token_urlsafe(64))
            text = text.replace("POSTGRES_PASSWORD=local-development-only", "POSTGRES_PASSWORD=" + secrets.token_urlsafe(32))
        path.write_text(text, encoding="utf-8")
        if os.name != "nt":
            path.chmod(0o600)
        print(f"Created {target}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["bootstrap", "dev", "down", "logs", "test", "lint",
                                            "migrate", "superuser", "schema", "build", "deploy",
                                            "backup", "backup-verify", "restore", "check-env", "validate-production"])
    parser.add_argument("--production", action="store_true")
    parser.add_argument("--file", type=Path, help="Local backup file to restore")
    parser.add_argument("--confirm-database", help="Exact database name required to restore")
    parser.add_argument("--release-sha", help="Full published commit SHA for deployment")
    parser.add_argument("--require-backup", action="store_true", help="Check off-host backup configuration before release")
    args = parser.parse_args()
    production = args.production or args.command in {"deploy", "build"}
    if args.command == "dev" and args.production:
        raise SystemExit("Use deploy --release-sha for production; dev --production would build untested images.")
    if args.command in {"test", "lint"} and args.production:
        raise SystemExit("Production images omit development tools. Use validate-production for runtime checks.")
    compose = ["docker", "compose", "-f", f"docker-compose.{'prod' if production else 'dev'}.yml"]
    if production:
        compose += ["--env-file", "backend/.env.production"]
        if args.command in {"down", "logs"}:
            compose += ["--profile", "backup-scheduler"]
    service = "web" if production else "backend"
    if args.command == "bootstrap":
        bootstrap()
        return
    if args.command == "validate-production":
        run([sys.executable, "infra/e2e/run.py"])
        return
    if args.command == "check-env":
        path = ROOT / "backend/.env.production"
        if not path.exists():
            raise SystemExit("Create backend/.env.production from its example first.")
        try:
            check_file(path, require_backup=args.require_backup)
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
        print("Required production environment values are configured.")
        return
    if args.command in {"dev", "down", "logs", "build"}:
        commands = {"dev": ["up", "-d", "--build"], "down": ["down"], "logs": ["logs", "-f", "--tail=100"], "build": ["build"]}
        run(compose + commands[args.command])
    elif args.command in {"migrate", "superuser", "schema"}:
        management = {"migrate": ["migrate", "--noinput"], "superuser": ["createsuperuser"],
                      "schema": ["spectacular", "--api-version", "v1", "--file", "/app/schema.yaml", "--validate", "--fail-on-warn"]}
        run(compose + ["exec", service, "python", "manage.py"] + management[args.command])
        if args.command == "schema":
            (ROOT / "contracts/openapi").mkdir(parents=True, exist_ok=True)
            run(compose + ["cp", f"{service}:/app/schema.yaml", "contracts/openapi/schema.yaml"])
    elif args.command == "test":
        run(compose + ["exec", "-T", service, "pytest", "-q"])
        run(compose + ["exec", "-T", "frontend", "pnpm", "test"])
    elif args.command == "lint":
        run(compose + ["exec", "-T", service, "ruff", "check", "apps", "core", "config", "tests"])
        for command in ["typecheck", "lint"]:
            run(compose + ["exec", "-T", "frontend", "pnpm", command])
    elif args.command == "backup":
        folder = ROOT / "backups"
        folder.mkdir(exist_ok=True)
        target = folder / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + ".dump")
        try:
            with target.open("wb") as stream:
                run(compose + ["exec", "-T", "postgres", "sh", "-ec",
                    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-privileges'], stdout=stream)
        except BaseException:
            target.unlink(missing_ok=True)
            raise
        print(target)
    elif args.command == "restore":
        if not args.file or not args.file.is_file() or not args.confirm_database:
            raise SystemExit("Pass --file and --confirm-database with the exact destination database.")
        actual = subprocess.check_output(compose + ["exec", "-T", "postgres", "printenv", "POSTGRES_DB"], cwd=ROOT, text=True).strip()
        if actual != args.confirm_database:
            raise SystemExit("Database confirmation does not match the selected stack.")
        with args.file.open("rb") as stream:
            run(compose + ["exec", "-T", "postgres", "sh", "-ec",
                'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges --single-transaction'], stdin=stream)
    elif args.command == "backup-verify":
        if not args.production:
            raise SystemExit("Use backup-verify --production for the configured private backup bucket.")
        for executable, extra in [("backup", []), ("restore", ["--verify-latest"])]:
            run(compose + ["run", "--rm", "--no-deps", "-T", "--entrypoint", f"/usr/local/bin/{executable}", "backup"] + extra,
                stdin=subprocess.DEVNULL)
    elif args.command == "deploy":
        if os.name == "nt" or not args.release_sha:
            raise SystemExit("Deploy on the Linux VPS with --release-sha FULL_PUBLISHED_SHA; see docs/DEPLOYMENT.md.")
        run(["bash", "deploy.sh", args.release_sha], stdin=subprocess.DEVNULL)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        raise SystemExit(exc.returncode) from exc
