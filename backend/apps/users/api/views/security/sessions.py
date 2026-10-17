"""
API endpoint for listing the authenticated user's active sessions.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.security.session import (
    SessionSerializer,
)
from apps.users.services.security.list_sessions import (
    list_active_sessions,
)
from core.api.base import BaseAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    success_schema,
    unauthorized_schema,
)


class SessionListAPIView(BaseAPIView):
    """
    List every active session belonging to the authenticated user.
    """

    @extend_schema(
        tags=["Security"],
        summary="List active sessions",
        description=(
            "Retrieve every active session belonging to the authenticated user."
        ),
        responses={
            200: success_schema(
                description="Sessions retrieved successfully.",
                response=SessionSerializer(many=True),
            ),
            401: unauthorized_schema(),
        },
    )
    def get(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:
        """
        Return all active sessions.
        """
        # ---------------------------------------------------------------------
        # Current session
        # ---------------------------------------------------------------------

        # Read through the base view: `request.auth` is None under
        # session authentication, so calling .get() on it directly
        # raises AttributeError and returns a 500.
        current_session_id = self.get_current_session_id()

        sessions = list_active_sessions(
            user=request.user,
        )

        serializer = SessionSerializer(
            sessions,
            many=True,
            context={
                "current_session_id": current_session_id,
            },
        )

        return SuccessResponse.ok(
            message="Sessions retrieved successfully.",
            data=serializer.data,
        )
