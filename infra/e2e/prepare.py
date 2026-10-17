"""Generate local-only credentials and TLS fixtures; never read production secrets."""
import secrets
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "infra/e2e/generated"
OUT.mkdir(parents=True, exist_ok=True)
values = {
    "APP_NAME": "Ghormu", "APP_SLUG": "ghormu-e2e",
    "PRODUCTION_ENV_FILE": "./infra/e2e/generated/test.env",
    "BACKEND_IMAGE": "ghormu-e2e-backend:local", "FRONTEND_IMAGE": "ghormu-e2e-frontend:local",
    "BACKUP_IMAGE": "ghormu-e2e-backup:local",
    "POSTGRES_DB": "ghormu_e2e", "POSTGRES_USER": "ghormu_e2e",
    "POSTGRES_HOST": "postgres", "POSTGRES_PORT": "5432",
    "REDIS_HOST": "redis", "REDIS_PORT": "6379",
    "ALLOWED_HOSTS": "starter.test,web,127.0.0.1", "TRUSTED_PROXY_COUNT": "1",
    "CORS_ALLOWED_ORIGINS": "https://starter.test:8446", "CORS_ALLOW_ALL_ORIGINS": "False",
    "NEXT_PUBLIC_SITE_URL": "https://starter.test:8446", "MEDIA_HOST": "media.starter.test",
    "FRONTEND_URL": "https://starter.test:8446",
    "USE_CLOUD_STORAGE": "True", "R2_BUCKET_NAME": "media",
    "R2_ENDPOINT_URL": "http://minio:9000", "R2_CUSTOM_DOMAIN": "media.starter.test:8446",
    "R2_REGION": "us-east-1", "R2_ADDRESSING_STYLE": "path", "R2_QUERYSTRING_AUTH": "False",
    "R2_ACCESS_KEY_ID": "validation-storage", "R2_SECRET_ACCESS_KEY": "validation-storage-password",
    "BACKUP_BUCKET": "private-backups", "BACKUP_ENDPOINT_URL": "http://minio:9000",
    "BACKUP_REGION": "us-east-1", "EMAIL_BACKEND": "django.core.mail.backends.smtp.EmailBackend",
    "EMAIL_HOST": "mailpit", "EMAIL_PORT": "1025", "EMAIL_USE_TLS": "False", "EMAIL_USE_SSL": "False",
    "DEFAULT_FROM_EMAIL": "validation@example.test",
    "E2E_FIXTURES": "1", "E2E_PASSWORD": "Validation-Only-Strong-Password-42!",
    "GUNICORN_WORKERS": "2", "CELERY_WORKER_CONCURRENCY": "2", "DB_SSLMODE": "disable",
}
for key in ("SECRET_KEY", "JWT_SIGNING_KEY", "POSTGRES_PASSWORD", "REDIS_PASSWORD"):
    values[key] = secrets.token_urlsafe(48)
if not (OUT / "test.env").exists():
    (OUT / "test.env").write_text("".join(f"{key}={value}\n" for key, value in values.items()))
openssl = shutil.which("openssl") or "C:/Program Files/Git/usr/bin/openssl.exe"
subprocess.run([openssl, "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2",
               "-keyout", str(OUT / "privkey.pem"), "-out", str(OUT / "fullchain.pem"),
               "-subj", "/CN=starter.test", "-addext", "subjectAltName=DNS:starter.test,DNS:api.starter.test,DNS:media.starter.test"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
config = (ROOT / "infra/nginx/sites/app.conf").read_text().replace("example.com", "starter.test")
config += """
server {
    listen 443 ssl;
    server_name media.starter.test;
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    location / { proxy_pass http://minio:9000/media/; proxy_set_header Host minio:9000; }
}
"""
(OUT / "app.conf").write_text(config)
print("Generated isolated validation configuration in infra/e2e/generated")
