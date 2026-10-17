"""
API endpoint for revoking an active session.
"""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.exceptions.security import (
    CurrentSessionRevokeDenied,
)
from apps.users.selectors.security.session import (
    get_user_session_by_id,
)
from apps.users.services.security.revoke_session import (
    revoke_session,
)
from core.api.base import BaseAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    forbidden_schema,
    not_found_schema,
    success_schema,
    unauthorized_schema,
)
from core.exceptions import NotFound


class RevokeSessionAPIView(BaseAPIView):
    """
    Revoke one active session belonging to the authenticated user.
    """

    @extend_schema(
        tags=["Security"],
        summary="Revoke session",
        description=("Revoke one active session belonging to the authenticated user."),
        responses={
            200: success_schema(
                description="Session revoked successfully.",
            ),
            401: unauthorized_schema(),
            403: forbidden_schema(),
            404: not_found_schema(),
        },
    )
    def delete(
        self,
        request: Request,
        session_id: UUID,
        *args,
        **kwargs,
    ) -> Response:

        # ---------------------------------------------------------------------
        # Retrieve session
        # ---------------------------------------------------------------------

        session = get_user_session_by_id(
            session_id=session_id,
            user=request.user,
        )

        # The selector returns None for an unknown or foreign session.
        # Dereferencing it directly turned a routine 404 into a 500.
        if session is None:
            raise NotFound("Session not found.")

        # ---------------------------------------------------------------------
        # Prevent revoking current session
        # ---------------------------------------------------------------------

        current_session_id = self.get_current_session_id()

        if current_session_id and str(session.id) == str(current_session_id):
            raise CurrentSessionRevokeDenied()

        # ---------------------------------------------------------------------
        # Revoke
        # ---------------------------------------------------------------------

        revoke_session(
            session=session,
        )

        return SuccessResponse.ok(
            message="Session revoked successfully.",
        )
