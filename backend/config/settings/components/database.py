"""
Database configuration.
"""

from config.settings.env import env

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST"),
        "PORT": env("POSTGRES_PORT"),
        # Persistent connections. Without this Django opens and closes a
        # PostgreSQL connection for every request; the TCP handshake plus
        # authentication typically costs more than the queries do.
        #
        # Must stay below the database's own idle timeout, and below any
        # connection pooler's, or the application will hand out sockets
        # the server has already closed.
        "CONN_MAX_AGE": env.int(
            "DB_CONN_MAX_AGE",
            default=60,
        ),
        # Verifies a pooled connection is still usable before reusing it,
        # turning a stale socket into a transparent reconnect instead of
        # a failed request.
        "CONN_HEALTH_CHECKS": env.bool(
            "DB_CONN_HEALTH_CHECKS",
            default=True,
        ),
        "OPTIONS": {
            # Caps how long a single statement may run. A runaway query
            # otherwise holds a connection, and any locks it took, until
            # it finishes.
            "options": (
                f"-c statement_timeout="
                f"{env.int('DB_STATEMENT_TIMEOUT_MS', default=30000)}"
            ),
        },
        "ATOMIC_REQUESTS": env.bool(
            "DB_ATOMIC_REQUESTS",
            default=False,
        ),
        "TEST": {
            "NAME": env(
                "POSTGRES_TEST_DB",
                default=None,
            ),
        },
    }
}
