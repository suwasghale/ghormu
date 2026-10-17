"""
Regression tests for previously shipped defects.

Each test here corresponds to a bug that was live in the codebase. They
exist to make sure the specific failure cannot come back.
"""

from __future__ import annotations

import pytest
from django.test import override_settings
from django.urls import reverse

from tests.factories import DEFAULT_PASSWORD, SuperUserFactory

pytestmark = pytest.mark.django_db


# ------------------------------------------------------------------------------
# Session-authenticated requests
# ------------------------------------------------------------------------------


def test_django_admin_loads_for_a_staff_user(client):
    """
    SessionActivityMiddleware read `request.auth`, which only exists on
    a DRF request. Every session-authenticated request - meaning every
    Django admin page - raised AttributeError and returned a 500.
    """

    admin = SuperUserFactory()

    assert client.login(
        email=admin.email,
        password=DEFAULT_PASSWORD,
    )

    response = client.get("/django-admin/")

    assert response.status_code == 200


def test_admin_login_page_loads(client):
    response = client.get("/django-admin/login/")

    assert response.status_code == 200


# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------


def test_frontend_url_is_not_hardcoded_to_localhost():
    """
    components/email.py assigned FRONTEND_URL after components/auth.py
    had derived the callback URLs from the environment, so production
    verification and reset links pointed at localhost.
    """

    from django.conf import settings

    import config.settings.components.email as email_component

    assert not hasattr(email_component, "FRONTEND_URL")
    assert settings.FRONTEND_PASSWORD_RESET_URL.startswith(
        settings.FRONTEND_URL,
    )


def test_csrf_trusted_origins_is_environment_driven():
    """
    components/cors.py hardcoded this, silently overriding the value
    components/sessions.py had read from the environment.
    """

    from django.conf import settings

    assert settings.CSRF_TRUSTED_ORIGINS == settings.CORS_ALLOWED_ORIGINS


def test_cors_does_not_allow_all_origins_with_credentials():
    """
    Allow-all plus credentials makes django-cors-headers echo the
    caller's Origin, letting any site issue credentialed requests.
    """

    from django.conf import settings

    assert not (settings.CORS_ALLOW_ALL_ORIGINS and settings.CORS_ALLOW_CREDENTIALS)


# ------------------------------------------------------------------------------
# Celery wiring
# ------------------------------------------------------------------------------


def test_every_scheduled_task_is_registered():
    """
    The beat schedule named a task that was neither imported by
    apps.users.tasks nor registered under that name, so the session
    cleanup job silently never ran.
    """

    from django.conf import settings

    from config.celery import app

    app.autodiscover_tasks(force=True)

    scheduled = {entry["task"] for entry in settings.CELERY_BEAT_SCHEDULE.values()}

    missing = scheduled - set(app.tasks)

    assert not missing, f"unregistered scheduled tasks: {missing}"


# ------------------------------------------------------------------------------
# Error handling
# ------------------------------------------------------------------------------


def test_unhandled_errors_return_the_json_envelope(
    authed_client,
    monkeypatch,
):
    """
    The handler used to `raise exc`, which broke the JSON contract and
    leaked a traceback page.
    """

    def boom(**kwargs):
        raise RuntimeError("database on fire")

    monkeypatch.setattr(
        "apps.users.api.views.auth.me.get_user_by_id",
        boom,
    )

    response = authed_client.get(reverse("v1:auth:me"))

    assert response.status_code == 500
    assert response.data["success"] is False
    assert "database on fire" not in str(response.data)


# ------------------------------------------------------------------------------
# Throttling
# ------------------------------------------------------------------------------


@pytest.fixture
def throttle_rate(monkeypatch):
    """
    Set a throttle scope's rate for the duration of a test.

    override_settings on REST_FRAMEWORK does not work here: DRF reads
    the rates once into a cached APISettings object, so the class
    attribute has to be patched instead.
    """

    def _set(throttle_cls, rate):
        monkeypatch.setattr(
            throttle_cls,
            "THROTTLE_RATES",
            {**throttle_cls.THROTTLE_RATES, throttle_cls.scope: rate},
            raising=False,
        )

    return _set


def test_email_verification_is_throttled(api_client, throttle_rate):
    """
    This endpoint consumes a secret and previously had no throttle, so
    it accepted unlimited token guesses.
    """

    from core.api.throttles import EmailVerificationThrottle

    throttle_rate(EmailVerificationThrottle, "2/hour")

    url = reverse("v1:auth:email-verify")

    for _ in range(2):
        api_client.post(url, {"token": "guess"}, format="json")

    response = api_client.post(
        url,
        {"token": "guess"},
        format="json",
    )

    assert response.status_code == 429


def test_verification_resend_is_throttled(api_client, throttle_rate):
    """
    Each call queues an outbound email to a caller-chosen address.
    """

    from core.api.throttles import EmailVerificationResendThrottle

    throttle_rate(EmailVerificationResendThrottle, "2/hour")

    url = reverse("v1:auth:email-resend")

    for _ in range(2):
        api_client.post(
            url,
            {"email": "target@example.test"},
            format="json",
        )

    response = api_client.post(
        url,
        {"email": "target@example.test"},
        format="json",
    )

    assert response.status_code == 429


def test_forged_forwarded_header_cannot_reset_the_throttle():
    """
    DRF's default AnonRateThrottle trusts the left-most X-Forwarded-For
    entry, so a client can bypass it by varying the header. With
    TRUSTED_PROXY_COUNT at 0 the header must be ignored entirely.
    """

    from rest_framework.test import APIRequestFactory

    from core.api.throttles import LoginThrottle

    request = APIRequestFactory().post(
        "/",
        REMOTE_ADDR="10.0.0.1",
        HTTP_X_FORWARDED_FOR="1.2.3.4",
    )

    assert LoginThrottle().get_ident(request) == "10.0.0.1"


@override_settings(TRUSTED_PROXY_COUNT=1)
def test_one_trusted_proxy_reads_the_correct_hop():
    """
    With a single proxy the right-most entry is the only one the proxy
    itself wrote, so anything the client prepended is discarded.
    """

    from rest_framework.test import APIRequestFactory

    from core.api.throttles import LoginThrottle

    request = APIRequestFactory().post(
        "/",
        REMOTE_ADDR="10.0.0.1",
        HTTP_X_FORWARDED_FOR="9.9.9.9, 203.0.113.7",
    )

    assert LoginThrottle().get_ident(request) == "203.0.113.7"


# ------------------------------------------------------------------------------
# Environment file semantics
# ------------------------------------------------------------------------------


def test_a_blank_env_value_falls_back_to_its_default(monkeypatch):
    """
    Regression: .env.example documents several settings as "leave blank
    to use the default", but django-environ treats an empty value as
    set. Copying the example to .env therefore produced an empty
    CSRF_TRUSTED_ORIGINS, an empty session cookie name and an empty
    email site name - in every new project, since that copy is the
    first thing anyone does.
    """

    from config.settings.env import env_list, env_str

    monkeypatch.setenv("BLANK_TEST_STR", "")
    monkeypatch.setenv("BLANK_TEST_LIST", "")

    assert env_str("BLANK_TEST_STR", default="fallback") == "fallback"
    assert env_list("BLANK_TEST_LIST", default=["a"]) == ["a"]

    monkeypatch.setenv("BLANK_TEST_STR", "  ")
    assert env_str("BLANK_TEST_STR", default="fallback") == "fallback"

    monkeypatch.setenv("BLANK_TEST_STR", "real")
    monkeypatch.setenv("BLANK_TEST_LIST", "x, y ,z")

    assert env_str("BLANK_TEST_STR", default="fallback") == "real"
    assert env_list("BLANK_TEST_LIST", default=["a"]) == ["x", "y", "z"]


def test_settings_that_document_a_default_are_never_empty():
    """
    The concrete consequences of the bug above.
    """

    from django.conf import settings

    assert settings.CSRF_TRUSTED_ORIGINS
    assert settings.SESSION_COOKIE_NAME
    assert settings.EMAIL_SITE_NAME
    assert settings.EMAIL_SUBJECT_PREFIX

    # The worst of the family: a blank value here put an empty link in
    # every password reset email.
    assert settings.FRONTEND_PASSWORD_RESET_URL
    assert settings.FRONTEND_EMAIL_VERIFICATION_URL
    assert settings.FRONTEND_EMAIL_CHANGE_URL
    assert settings.SIMPLE_JWT["SIGNING_KEY"]

    for url in (
        settings.FRONTEND_PASSWORD_RESET_URL,
        settings.FRONTEND_EMAIL_VERIFICATION_URL,
        settings.FRONTEND_EMAIL_CHANGE_URL,
    ):
        assert url.startswith("http"), url

    # CACHES is replaced wholesale by the test settings, so the cache
    # key prefix is covered by the env_str test above rather than here.


# ------------------------------------------------------------------------------
# Deployment configuration
# ------------------------------------------------------------------------------


def _repo_root():
    import pathlib

    return pathlib.Path(__file__).resolve().parents[3]


#: The deployment files live above `backend/`, and the dev container only
#: mounts `backend/` — so inside it `_repo_root()` resolves to `/` and the
#: three checks below fail for want of a filesystem, not for want of
#: correct configuration. Skipped there and run in CI, where the whole
#: repository is checked out, rather than left to fail in a way that
#: trains everyone to ignore a red suite.
needs_repo_checkout = pytest.mark.skipif(
    not (_repo_root() / "infra").is_dir(),
    reason="deployment files are outside the mounted backend/ directory",
)


@needs_repo_checkout
def test_dockerfiles_match_the_required_python_version():
    """
    Regression: the images were python:3.13-slim while pyproject
    requires >=3.14, so `uv sync --locked` failed at build time.
    """

    import re
    import tomllib

    root = _repo_root()

    pyproject = tomllib.loads(
        (root / "backend/pyproject.toml").read_text(encoding="utf-8"),
    )

    required = re.search(
        r"(\d+)\.(\d+)",
        pyproject["project"]["requires-python"],
    )
    wanted = f"{required.group(1)}.{required.group(2)}"

    for name in ("Dockerfile", "Dockerfile.dev"):
        path = root / "infra/docker/backend" / name

        if not path.exists():
            continue

        image = re.search(
            r"^FROM python:([\d.]+)",
            path.read_text(encoding="utf-8"),
            re.MULTILINE,
        )

        assert image, f"{name} has no python base image"
        assert image.group(1).startswith(wanted), (
            f"{name} uses python:{image.group(1)} but pyproject requires {wanted}"
        )


@needs_repo_checkout
def test_dockerignore_sits_at_the_build_context_root():
    """
    Regression: .dockerignore lived next to the Dockerfile, but the
    build context is the repository root and Docker only reads it from
    there. `COPY backend/ .` was baking .env, .venv and .git into the
    image.
    """

    root = _repo_root()

    path = root / ".dockerignore"

    assert path.exists(), (
        ".dockerignore must be at the build context root, not beside the Dockerfile"
    )

    content = path.read_text(encoding="utf-8")

    for pattern in (".env", ".git", ".venv"):
        assert pattern in content, f"{pattern} is not excluded"


@needs_repo_checkout
def test_nginx_configuration_is_not_empty():
    """
    Regression: both nginx files were zero bytes while the production
    compose mounted them, so the container had no configuration at all.
    """

    root = _repo_root()

    main = root / "infra/nginx/nginx.conf"

    assert main.exists() and main.stat().st_size > 0, "nginx.conf is empty"

    sites = list((root / "infra/nginx/sites").glob("*.conf"))

    assert sites, "no server block in infra/nginx/sites"
    assert all(path.stat().st_size > 0 for path in sites)

    content = main.read_text(encoding="utf-8")
    site = sites[0].read_text(encoding="utf-8")

    # Without these Django cannot resolve the client IP or know the
    # request arrived over TLS, and SECURE_SSL_REDIRECT loops.
    assert "X-Forwarded-For" in site
    assert "X-Forwarded-Proto" in site
    assert "upstream backend" in content


def test_celery_broker_and_cache_use_different_redis_databases():
    """
    Sharing one database means a cache flush drops queued tasks.
    """

    from django.conf import settings

    broker = settings.CELERY_BROKER_URL.rsplit("/", 1)[-1]
    cache_location = settings.CACHES["default"].get("LOCATION", "")

    if not cache_location.startswith("redis"):
        pytest.skip("cache is not Redis in this environment")

    assert broker != cache_location.rsplit("/", 1)[-1]
