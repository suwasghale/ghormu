"""Validate the starter's deployment contract without printing secret values."""
from pathlib import Path
import re
from urllib.parse import urlsplit


def read_environment(path: Path) -> dict[str, str]:
    values = {}
    for number, raw in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if not separator or not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError(f"Environment line {number}: use KEY=value assignments.")
        if key in values:
            raise ValueError(f"{key}: duplicate assignment.")
        # Compose interpolation and dotenv quoting must not change a secret
        # between preflight, Compose substitution and service env_file loading.
        if "$" in value or value.startswith(("'", '"')) or " #" in value:
            raise ValueError(f"{key}: use an unquoted literal value without interpolation or inline comments.")
        values[key] = value
    return values


def validate_environment(values: dict[str, str], *, require_backup=False) -> list[str]:
    errors = []

    def required(key):
        value = values.get(key, "")
        if not value or "CHANGE_ME" in value or "example.com" in value:
            errors.append(f"{key}: configure a project-specific value.")
        return value

    def flag(key, default=False):
        value = values.get(key, str(default)).lower()
        if value not in {"true", "false", "1", "0", "yes", "no", "on", "off"}:
            errors.append(f"{key}: use True or False.")
        return value in {"true", "1", "yes", "on"}

    def https(key, *, origin=False):
        value = required(key)
        try:
            parsed = urlsplit(value)
            valid = (parsed.scheme == "https" and parsed.hostname and not parsed.username
                     and not parsed.password and not parsed.query and not parsed.fragment)
            parsed.port  # Validate malformed/out-of-range ports too.
            if origin:
                valid = valid and parsed.path in {"", "/"}
            if not valid:
                raise ValueError
            return parsed
        except ValueError:
            errors.append(f"{key}: use an HTTPS {'origin' if origin else 'endpoint'} without credentials, query or fragment.")
            return None

    def origins(key, site):
        configured = [value.strip().rstrip("/") for value in required(key).split(",") if value.strip()]
        for value in configured:
            try:
                parsed = urlsplit(value)
                valid = (parsed.scheme == "https" and parsed.hostname and not parsed.username
                         and not parsed.password and parsed.path == "" and not parsed.query and not parsed.fragment)
                parsed.port
                if not valid:
                    raise ValueError
            except ValueError:
                errors.append(f"{key}: every entry must be an explicit HTTPS origin.")
        if site not in configured:
            errors.append(f"{key}: include NEXT_PUBLIC_SITE_URL.")

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,62}", required("APP_SLUG")):
        errors.append("APP_SLUG: use 1–63 lowercase letters, numbers or hyphens.")
    for key in ("SECRET_KEY", "JWT_SIGNING_KEY", "POSTGRES_PASSWORD", "REDIS_PASSWORD"):
        minimum = 50 if "KEY" in key else 24
        if len(required(key)) < minimum:
            errors.append(f"{key}: use at least {minimum} characters.")
    if values.get("SECRET_KEY") == values.get("JWT_SIGNING_KEY"):
        errors.append("JWT_SIGNING_KEY: use an independent signing key.")
    if flag("DEBUG"):
        errors.append("DEBUG: must be False in production.")
    site = https("NEXT_PUBLIC_SITE_URL", origin=True)
    public_origin = values.get("NEXT_PUBLIC_SITE_URL", "").rstrip("/")
    if required("FRONTEND_URL").rstrip("/") != public_origin:
        errors.append("FRONTEND_URL: must match NEXT_PUBLIC_SITE_URL.")
    hosts = [host.strip() for host in required("ALLOWED_HOSTS").split(",")]
    if any("*" in host or host.startswith(".") for host in hosts):
        errors.append("ALLOWED_HOSTS: enumerate explicit hosts; wildcards are not allowed.")
    if site and site.hostname not in hosts:
        errors.append("ALLOWED_HOSTS: include the public site's hostname.")
    if "web" not in hosts:
        errors.append("ALLOWED_HOSTS: include the internal web service hostname.")
    for key in ("CORS_ALLOWED_ORIGINS", "CSRF_TRUSTED_ORIGINS"):
        origins(key, public_origin)
    if flag("CORS_ALLOW_ALL_ORIGINS"):
        errors.append("CORS_ALLOW_ALL_ORIGINS: must be False.")
    for key in ("POSTGRES_DB", "POSTGRES_USER"):
        required(key)

    if require_backup:
        for key in ("EMAIL_HOST", "DEFAULT_FROM_EMAIL", "BACKUP_BUCKET", "BACKUP_ACCESS_KEY_ID", "BACKUP_SECRET_ACCESS_KEY"):
            required(key)
        if values.get("EMAIL_BACKEND") != "django.core.mail.backends.smtp.EmailBackend":
            errors.append("EMAIL_BACKEND: the bundled release requires the configured SMTP backend.")
        if flag("EMAIL_USE_TLS") == flag("EMAIL_USE_SSL"):
            errors.append("EMAIL_USE_TLS/EMAIL_USE_SSL: enable exactly one SMTP encryption mode.")
        try:
            if not 1 <= int(values.get("EMAIL_PORT", "587")) <= 65535:
                raise ValueError
        except ValueError:
            errors.append("EMAIL_PORT: use a valid port number.")
        https("BACKUP_ENDPOINT_URL")
        try:
            if int(values.get("BACKUP_RETENTION_DAYS", "30")) < 1:
                raise ValueError
        except ValueError:
            errors.append("BACKUP_RETENTION_DAYS: use a positive integer.")
        prefix = values.get("BACKUP_PREFIX", "backups/postgres")
        if not prefix.strip("/") or prefix.startswith("/") or ".." in prefix.split("/"):
            errors.append("BACKUP_PREFIX: use a non-empty relative object prefix without traversal.")
        if values.get("BACKUP_BUCKET") == values.get("R2_BUCKET_NAME"):
            errors.append("BACKUP_BUCKET: use a private bucket separate from public media.")

    if flag("USE_CLOUD_STORAGE"):
        for key in ("R2_BUCKET_NAME", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"):
            required(key)
        https("R2_ENDPOINT_URL")
        media = required("R2_CUSTOM_DOMAIN")
        if not re.fullmatch(r"[a-zA-Z0-9.-]+(?::[0-9]+)?", media):
            errors.append("R2_CUSTOM_DOMAIN: use a hostname with an optional port, without a scheme or path.")
        if required("MEDIA_HOST") != media:
            errors.append("MEDIA_HOST: must match R2_CUSTOM_DOMAIN and the frontend build setting.")
    return errors


def check_file(path: Path, *, require_backup=False):
    errors = validate_environment(read_environment(path), require_backup=require_backup)
    if errors:
        raise ValueError("Production configuration is incomplete:\n- " + "\n- ".join(errors))
