from __future__ import annotations

from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from core.security.request_meta import get_client_ip, get_user_agent


class BaseAPIView(GenericAPIView):
    """
    Base API view for the entire project.
    """

    serializer_class = None
    queryset = None

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    # ------------------------------------------------------------------
    # Client helpers
    # ------------------------------------------------------------------

    def get_client_ip(self) -> str | None:
        """
        Return the client's IP, honouring the trusted proxy config.
        """

        return get_client_ip(self.request)

    def get_user_agent(self) -> str:
        """
        Return the client's User-Agent, truncated to a safe length.
        """

        return get_user_agent(self.request)

    # ------------------------------------------------------------------
    # Session helpers
    # ------------------------------------------------------------------

    def get_current_session_id(self) -> str | None:
        """
        Return the session bound to the presenting access token.

        ``request.auth`` is ``None`` under session authentication, so
        reading the claim directly raises AttributeError and turns an
        ordinary request into a 500.
        """

        auth = getattr(self.request, "auth", None)

        if auth is None:
            return None

        try:
            return auth.get("session_id")

        except AttributeError:
            return None

    # ------------------------------------------------------------------
    # Convenience
    # ------------------------------------------------------------------

    @property
    def current_user(self):
        return self.request.user

    @property
    def is_authenticated(self) -> bool:
        return bool(self.request.user and self.request.user.is_authenticated)


class AuthenticatedAPIView(BaseAPIView):
    """
    Base view for endpoints that require an authenticated user.
    """

    permission_classes = (IsAuthenticated,)


class PublicAPIView(BaseAPIView):
    """
    Base view for unauthenticated endpoints.

    Authentication is disabled outright rather than merely permitted:
    leaving it enabled means an expired or malformed Authorization
    header rejects the request before the view is ever reached, which
    breaks login and refresh for exactly the clients that need them.
    """

    authentication_classes = ()

    permission_classes = (AllowAny,)
