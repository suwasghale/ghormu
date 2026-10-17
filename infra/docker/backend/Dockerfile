# ==============================================================================
# Base Image
# ==============================================================================

# Must match requires-python in pyproject.toml. On 3.13 the
# `uv sync --locked` below fails outright: the lockfile was
# resolved for 3.14.
FROM python:3.14-slim

# ==============================================================================
# Environment
# ==============================================================================

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# ==============================================================================
# System Dependencies
# ==============================================================================

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ==============================================================================
# Install uv
# ==============================================================================

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# ==============================================================================
# Create Non-root User
# ==============================================================================

RUN groupadd --system django && \
    useradd --system --gid django --create-home django

# ==============================================================================
# Working Directory
# ==============================================================================

WORKDIR /app

# ==============================================================================
# Dependency Layer
# ==============================================================================

COPY backend/pyproject.toml .
COPY backend/uv.lock .

RUN uv sync \
    --locked \
    --no-dev

# ==============================================================================
# Copy Project
# ==============================================================================

COPY backend/ .

# ==============================================================================
# Static Directory
# ==============================================================================

RUN DJANGO_ENV_FILE=/nonexistent DJANGO_SETTINGS_MODULE=config.settings.build \
    /app/.venv/bin/python manage.py collectstatic --noinput

# ==============================================================================
# Ownership
# ==============================================================================

RUN mkdir -p /app/media && chown -R django:django /app

USER django

# ==============================================================================
# PATH
# ==============================================================================

ENV PATH="/app/.venv/bin:$PATH"

# ==============================================================================
# Expose Port
# ==============================================================================

EXPOSE 8000

# ==============================================================================
# Healthcheck
# ==============================================================================

HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=30s \
            --retries=3 \
CMD python -c "import os,urllib.request; r=urllib.request.Request('http://127.0.0.1:8000/health/',headers={'Host':os.environ['ALLOWED_HOSTS'].split(',')[0].strip()}); assert urllib.request.urlopen(r,timeout=5).status == 200" || exit 1
# Liveness, deliberately: a container healthcheck decides
# whether to restart. Readiness (/health/ready/) belongs on
# the load balancer, and pointing this at it turns a
# database blip into a restart loop.

# ==============================================================================
# Start Application
# ==============================================================================

CMD [ \
  "gunicorn", \
  "config.wsgi:application", \
  "--bind", \
  "0.0.0.0:8000", \
  "--workers", \
  "3", \
  "--threads", \
  "2", \
  "--timeout", \
  "120" \
]
