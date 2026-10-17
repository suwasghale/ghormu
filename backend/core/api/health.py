"""
Health check endpoints.

Two probes, because they answer different questions:

- Liveness  - is the process running? Restart it if not.
- Readiness - can it serve traffic? Take it out of the load balancer
              if not, but do not restart it.

Conflating them causes restart loops: a database blip makes every
replica fail its liveness probe, the orchestrator kills them all, and
the outage gets worse rather than better.
"""

from __future__ import annotations

import logging

from django.core.cache import cache
from django.db import connections
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class LivenessAPIView(APIView):
    """
    Report that the process is up.

    Touches no dependency deliberately.
    """

    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = ()

    @extend_schema(
        tags=["Health"],
        summary="Liveness probe",
        responses={200: None},
    )
    def get(self, request) -> Response:
        return Response(
            {"status": "ok"},
            status=status.HTTP_200_OK,
        )


class ReadinessAPIView(APIView):
    """
    Report whether dependencies are reachable.
    """

    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = ()

    @extend_schema(
        tags=["Health"],
        summary="Readiness probe",
        description=(
            "Checks the database and cache. Returns 503 if either is unreachable."
        ),
        responses={200: None, 503: None},
    )
    def get(self, request) -> Response:
        checks = {
            "database": self._check_database(),
            "cache": self._check_cache(),
        }

        healthy = all(checks.values())

        return Response(
            {
                "status": "ok" if healthy else "degraded",
                "checks": checks,
            },
            status=(
                status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE
            ),
        )

    # --------------------------------------------------------------------------
    # Checks
    # --------------------------------------------------------------------------

    @staticmethod
    def _check_database() -> bool:
        try:
            with connections["default"].cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            return True

        except Exception:
            logger.warning(
                "Readiness: database unreachable.",
                exc_info=True,
            )
            return False

    @staticmethod
    def _check_cache() -> bool:
        try:
            key = "health:readiness"

            cache.set(key, "1", 5)

            # django-redis is configured with IGNORE_EXCEPTIONS, which
            # turns a connection failure into a silent None rather than
            # an exception - so the value has to be read back rather
            # than trusting that set() succeeded.
            return cache.get(key) == "1"

        except Exception:
            logger.warning(
                "Readiness: cache unreachable.",
                exc_info=True,
            )
            return False
