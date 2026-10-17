"""
Verify every external dependency this project needs.

"Sometimes email does not send" is almost never a code problem. It is
the console backend silently swallowing everything, or a worker that is
not running, or a broker on the wrong database. Each of those looks
identical from the application's point of view: the request succeeds
and nothing arrives.

This command asks each dependency directly and reports what it found,
so the answer is one line rather than an afternoon.

    python manage.py check_services
    python manage.py check_services --email-to you@example.com
"""

from __future__ import annotations

import time

from django.conf import settings
from django.core.cache import cache
from django.core.mail import get_connection, send_mail
from django.core.management.base import BaseCommand
from django.db import connections

OK = "  OK    "
WARN = "  WARN  "
FAIL = "  FAIL  "


class Command(BaseCommand):
    help = (
        "Check the database, cache, broker, worker, email backend and "
        "object storage, and report what is actually configured."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--email-to",
            help=(
                "Send a real test message to this address. Without it "
                "the email check only verifies the connection."
            ),
        )

        parser.add_argument(
            "--skip",
            action="append",
            default=[],
            choices=["db", "cache", "broker", "worker", "email", "storage"],
            help="Skip a check. Repeatable.",
        )

    def handle(self, *args, **options) -> None:
        skip = set(options["skip"])
        failures = 0

        checks = [
            ("db", self.check_database),
            ("cache", self.check_cache),
            ("broker", self.check_broker),
            ("worker", self.check_worker),
            ("email", lambda: self.check_email(options["email_to"])),
            ("storage", self.check_storage),
        ]

        for name, check in checks:
            if name in skip:
                self.stdout.write(f"  SKIP  {name}")
                continue

            try:
                if check() is False:
                    failures += 1
            except Exception as error:  # noqa: BLE001
                self.stdout.write(
                    self.style.ERROR(f"{FAIL}{name}: {error}"),
                )
                failures += 1

        self.stdout.write("")

        if failures:
            self.stdout.write(
                self.style.ERROR(f"{failures} check(s) failed."),
            )
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS("All checks passed."))

    # --------------------------------------------------------------------------
    # Database
    # --------------------------------------------------------------------------

    def check_database(self) -> bool:
        config = settings.DATABASES["default"]

        started = time.perf_counter()

        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0].split(",")[0]

        elapsed = (time.perf_counter() - started) * 1000

        self.stdout.write(
            self.style.SUCCESS(
                f"{OK}database  {version} "
                f"({config['HOST']}:{config['PORT']}, {elapsed:.0f}ms)",
            ),
        )

        # A connection that outlives the server's idle timeout is handed
        # out already closed.
        if config.get("CONN_MAX_AGE", 0) == 0:
            self.stdout.write(
                "        CONN_MAX_AGE is 0: a new connection per "
                "request. Fine behind PgBouncer, wasteful otherwise.",
            )

        return True

    # --------------------------------------------------------------------------
    # Cache
    # --------------------------------------------------------------------------

    def check_cache(self) -> bool:
        backend = settings.CACHES["default"]["BACKEND"]
        location = settings.CACHES["default"].get("LOCATION", "")

        key = "check_services:probe"

        cache.set(key, "1", 10)
        value = cache.get(key)
        cache.delete(key)

        if value != "1":
            # django-redis is configured with IGNORE_EXCEPTIONS, so a
            # dead Redis returns None instead of raising. Session
            # revocation would silently fall back to a database query
            # on every request.
            self.stdout.write(
                self.style.ERROR(
                    f"{FAIL}cache     wrote a value and read back "
                    f"{value!r} ({location})",
                ),
            )
            self.stdout.write(
                "        IGNORE_EXCEPTIONS hides the real error. "
                "Check the password and the database number.",
            )
            return False

        self.stdout.write(
            self.style.SUCCESS(
                f"{OK}cache     {backend.rsplit('.', 1)[-1]} "
                f"({self._redact(location)})",
            ),
        )

        return True

    # --------------------------------------------------------------------------
    # Broker
    # --------------------------------------------------------------------------

    def check_broker(self) -> bool:
        from kombu import Connection

        url = settings.CELERY_BROKER_URL

        connection = Connection(url, connect_timeout=5)

        try:
            connection.ensure_connection(max_retries=0)
        finally:
            connection.release()

        self.stdout.write(
            self.style.SUCCESS(
                f"{OK}broker    reachable ({self._redact(url)})",
            ),
        )

        # Sharing a database with the cache means a cache flush drops
        # queued jobs.
        cache_location = settings.CACHES["default"].get("LOCATION", "")

        same_db = url.rsplit("/", 1)[-1] == cache_location.rsplit("/", 1)[-1]

        if cache_location and same_db:
            self.stdout.write(
                self.style.WARNING(
                    "        broker and cache share a Redis database; "
                    "a cache flush would drop queued tasks",
                ),
            )

        return True

    # --------------------------------------------------------------------------
    # Worker
    # --------------------------------------------------------------------------

    def check_worker(self) -> bool:
        from config.celery import app

        if settings.CELERY_TASK_ALWAYS_EAGER:
            self.stdout.write(
                f"{OK}worker    eager mode (tasks run inline)",
            )
            return True

        replies = app.control.ping(timeout=3)

        if not replies:
            # The single most common cause of "the email never
            # arrived": the task was queued and nothing consumed it.
            self.stdout.write(
                self.style.ERROR(
                    f"{FAIL}worker    no Celery worker responded",
                ),
            )
            self.stdout.write(
                "        Email is sent from a task. With no worker, "
                "every message is queued and never delivered.",
            )
            self.stdout.write("        Start one: celery -A config worker")
            return False

        names = ", ".join(sorted(k for reply in replies for k in reply))

        self.stdout.write(
            self.style.SUCCESS(f"{OK}worker    {len(replies)} online ({names})"),
        )

        # Beat has no ping; the schedule is checked instead.
        scheduled = set(settings.CELERY_BEAT_SCHEDULE)
        registered = set(app.tasks)

        missing = {
            name
            for name, entry in settings.CELERY_BEAT_SCHEDULE.items()
            if entry["task"] not in registered
        }

        if missing:
            self.stdout.write(
                self.style.ERROR(
                    f"        scheduled but unregistered: {', '.join(sorted(missing))}",
                ),
            )
            return False

        self.stdout.write(
            f"        {len(scheduled)} scheduled task(s) registered",
        )

        return True

    # --------------------------------------------------------------------------
    # Email
    # --------------------------------------------------------------------------

    def check_email(self, recipient: str | None) -> bool:
        backend = settings.EMAIL_BACKEND

        # The failure that looks like success. Credentials can be
        # perfect and nothing is ever sent.
        if "console" in backend or "locmem" in backend or "dummy" in backend:
            self.stdout.write(
                self.style.WARNING(
                    f"{WARN}email     {backend.rsplit('.', 2)[-2]} backend "
                    "- nothing is delivered",
                ),
            )
            self.stdout.write(
                f"        EMAIL_HOST is set to {settings.EMAIL_HOST!r}, "
                "so this is probably not intended.",
            )
            self.stdout.write(
                "        Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend",
            )
            return False

        if settings.EMAIL_USE_TLS and settings.EMAIL_USE_SSL:
            self.stdout.write(
                self.style.ERROR(
                    f"{FAIL}email     EMAIL_USE_TLS and EMAIL_USE_SSL "
                    "are both on; Django refuses to send",
                ),
            )
            return False

        started = time.perf_counter()

        connection = get_connection(fail_silently=False)

        try:
            connection.open()
        except (TimeoutError, OSError) as error:
            self.stdout.write(
                self.style.ERROR(
                    f"{FAIL}email     cannot reach "
                    f"{settings.EMAIL_HOST}:{settings.EMAIL_PORT} "
                    f"- {error}",
                ),
            )
            return False
        finally:
            connection.close()

        elapsed = (time.perf_counter() - started) * 1000

        self.stdout.write(
            self.style.SUCCESS(
                f"{OK}email     SMTP {settings.EMAIL_HOST}:"
                f"{settings.EMAIL_PORT} "
                f"(TLS={settings.EMAIL_USE_TLS}, {elapsed:.0f}ms)",
            ),
        )

        if recipient:
            sent = send_mail(
                subject=f"[{settings.EMAIL_SITE_NAME}] check_services",
                message=(
                    "If you are reading this, SMTP delivery works.\n\n"
                    f"From: {settings.DEFAULT_FROM_EMAIL}\n"
                    f"Host: {settings.EMAIL_HOST}\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"        sent {sent} test message to {recipient}",
                ),
            )

        return True

    # --------------------------------------------------------------------------
    # Storage
    # --------------------------------------------------------------------------

    def check_storage(self) -> bool:
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage

        backend = settings.STORAGES["default"]["BACKEND"]

        if not settings.USE_CLOUD_STORAGE:
            self.stdout.write(
                f"{OK}storage   local filesystem ({settings.MEDIA_ROOT})",
            )
            return True

        missing = [
            name
            for name in (
                "AWS_ACCESS_KEY_ID",
                "AWS_SECRET_ACCESS_KEY",
                "AWS_STORAGE_BUCKET_NAME",
                "AWS_S3_ENDPOINT_URL",
            )
            if not getattr(settings, name, "")
        ]

        if missing:
            self.stdout.write(
                self.style.ERROR(
                    f"{FAIL}storage   cloud storage is on but "
                    f"{', '.join(missing)} unset",
                ),
            )
            return False

        name = default_storage.save(
            "healthcheck/probe.txt",
            ContentFile(b"probe"),
        )

        try:
            readable = default_storage.open(name).read() == b"probe"
        finally:
            default_storage.delete(name)

        if not readable:
            self.stdout.write(
                self.style.ERROR(
                    f"{FAIL}storage   wrote an object but read it back wrong",
                ),
            )
            return False

        self.stdout.write(
            self.style.SUCCESS(
                f"{OK}storage   {backend.rsplit('.', 1)[-1]} "
                f"bucket={settings.AWS_STORAGE_BUCKET_NAME} "
                "(write/read/delete verified)",
            ),
        )

        if not settings.AWS_S3_CUSTOM_DOMAIN:
            self.stdout.write(
                self.style.WARNING(
                    "        no R2_CUSTOM_DOMAIN: media URLs point at the raw endpoint",
                ),
            )

        return True

    # --------------------------------------------------------------------------
    # Helpers
    # --------------------------------------------------------------------------

    @staticmethod
    def _redact(url: str) -> str:
        """
        Strip the password from a connection URL before printing it.
        """

        if "@" not in url:
            return url

        scheme, _, rest = url.partition("://")
        _, _, host = rest.rpartition("@")

        return f"{scheme}://***@{host}"
