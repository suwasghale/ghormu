"""
OpenAPI extensions for this project's authentication.

drf-spectacular maps an authentication class to a security scheme by
looking up a registered extension. It has one for Simple JWT's stock
`JWTAuthentication`, but `SessionAwareJWTAuthentication` is a different
class, so without this it resolves nothing and emits **no security
requirement at all** for every authenticated endpoint.

The schema then claims the entire API is public, and a generated client
never sends the Authorization header. The endpoints still work; the
documentation is simply wrong in the most misleading direction.

Imported for its side effect by apps.users.apps.UsersConfig.ready.
"""

from __future__ import annotations

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class SessionAwareJWTScheme(OpenApiAuthenticationExtension):
    """
    Describe the project's JWT authentication as HTTP bearer.
    """

    target_class = "apps.users.authentication.SessionAwareJWTAuthentication"

    name = "jwtAuth"

    def get_security_definition(self, auto_schema) -> dict:
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": (
                "Access token from POST /api/v1/auth/login/, sent as "
                "`Authorization: Bearer <token>`.\n\n"
                "Tokens are bound to a server-side session, so revoking "
                "the session rejects the token on its next use rather "
                "than at expiry."
            ),
        }
