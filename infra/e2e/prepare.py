"""Generate local-only credentials and TLS fixtures; never read production secrets."""
import secrets
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "infra/e2e/generated"
TLS = OUT / "tls"
TLS.mkdir(parents=True, exist_ok=True)
values = {
    "APP_NAME": "Ghormu", "APP_SLUG": "ghormu-e2e",
    "PRODUCTION_ENV_FILE": "./infra/e2e/generated/test.env",
    "BACKEND_IMAGE": "ghormu-e2e-backend:local", "FRONTEND_IMAGE": "ghormu-e2e-frontend:local",
    "BACKUP_IMAGE": "ghormu-e2e-backup:local",
    # deploy/site.env's values, for the templated nginx. The browser connects
    # straight to nginx, so the edge's PROXY protocol is off; the published
    # ports are overridden in compose.yml.
    "SITE_DOMAIN": "starter.test", "SITE_ALIASES": "",
    "LISTEN_PROXY_PROTOCOL": "", "REAL_IP_HEADER": "X-Real-IP",
    "EDGE_HTTP_PORT": "8086", "EDGE_HTTPS_PORT": "8446",
    "POSTGRES_DB": "ghormu_e2e", "POSTGRES_USER": "ghormu_e2e",
    "POSTGRES_HOST": "postgres", "POSTGRES_PORT": "5432",
    "REDIS_HOST": "redis", "REDIS_PORT": "6379",
    "ALLOWED_HOSTS": "starter.test,web,127.0.0.1", "TRUSTED_PROXY_COUNT": "1",
    "CORS_ALLOWED_ORIGINS": "https://starter.test:8446", "CORS_ALLOW_ALL_ORIGINS": "False",
    "NEXT_PUBLIC_SITE_URL": "https://starter.test:8446", "MEDIA_HOST": "media.starter.test",
    "FRONTEND_URL": "https://starter.test:8446",
    "USE_CLOUD_STORAGE": "True", "R2_BUCKET_NAME": "media",
    "R2_ENDPOINT_URL": "http://s3:9000", "R2_CUSTOM_DOMAIN": "media.starter.test:8446",
    "R2_REGION": "us-east-1", "R2_ADDRESSING_STYLE": "path", "R2_QUERYSTRING_AUTH": "False",
    "R2_ACCESS_KEY_ID": "validation-storage", "R2_SECRET_ACCESS_KEY": "validation-storage-password",
    "BACKUP_BUCKET": "private-backups", "BACKUP_ENDPOINT_URL": "http://s3:9000",
    "BACKUP_REGION": "us-east-1", "EMAIL_BACKEND": "django.core.mail.backends.smtp.EmailBackend",
    "EMAIL_HOST": "mailpit", "EMAIL_PORT": "1025", "EMAIL_USE_TLS": "False", "EMAIL_USE_SSL": "False",
    "DEFAULT_FROM_EMAIL": "validation@example.test",
    "E2E_FIXTURES": "1", "E2E_PASSWORD": "Validation-Only-Strong-Password-42!",
    "GUNICORN_WORKERS": "2", "CELERY_WORKER_CONCURRENCY": "2", "DB_SSLMODE": "disable",
}
# Keep only the generated secrets between runs and rewrite every other
# setting, so a stale file can never point the tests at a removed service.
env_file = OUT / "test.env"
kept = {}
if env_file.exists():
    for line in env_file.read_text().splitlines():
        key, _, value = line.partition("=")
        if key in ("SECRET_KEY", "JWT_SIGNING_KEY", "POSTGRES_PASSWORD", "REDIS_PASSWORD"):
            kept[key] = value
for key in ("SECRET_KEY", "JWT_SIGNING_KEY", "POSTGRES_PASSWORD", "REDIS_PASSWORD"):
    values[key] = kept.get(key) or secrets.token_urlsafe(48)
env_file.write_text("".join(f"{key}={value}\n" for key, value in values.items()))
openssl = shutil.which("openssl") or "C:/Program Files/Git/usr/bin/openssl.exe"
subprocess.run([openssl, "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2",
               "-keyout", str(TLS / "privkey.pem"), "-out", str(TLS / "fullchain.pem"),
               "-subj", "/CN=starter.test", "-addext", "subjectAltName=DNS:starter.test,DNS:api.starter.test,DNS:media.starter.test"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# The media bucket's public hostname, which R2 would serve in production.
(OUT / "media.conf").write_text("""server {
    listen 443 ssl;
    server_name media.starter.test;
    ssl_certificate /etc/letsencrypt/live/starter.test/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/starter.test/privkey.pem;
    location / { proxy_pass http://s3:9000/media/; proxy_set_header Host s3:9000; }
}
""")
print("Generated isolated validation configuration in infra/e2e/generated")
