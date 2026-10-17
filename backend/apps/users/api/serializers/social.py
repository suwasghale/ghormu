"""
Serializers for social sign-in.
"""

from __future__ import annotations

from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers


class SocialProviderListSerializer(serializers.Serializer):
    """
    Providers this deployment has configured.
    """

    providers = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )


class SocialAuthorizeRequestSerializer(serializers.Serializer):
    """
    Where the provider should send the user back to.
    """

    redirect_uri = serializers.URLField()

    def validate_redirect_uri(self, value: str) -> str:
        """
        Only allow redirect targets we already trust.

        An unvalidated redirect_uri is an open redirect that carries an
        authorization code: an attacker supplies their own callback,
        the provider sends the code there, and they exchange it. The
        allow-list is the CORS origins, which are already the set of
        front ends permitted to talk to this API.
        """

        parsed = urlparse(value)

        origin = f"{parsed.scheme}://{parsed.netloc}"

        allowed = set(settings.CORS_ALLOWED_ORIGINS)

        if origin not in allowed:
            raise serializers.ValidationError(
                "This redirect URI is not allowed.",
            )

        return value


class SocialAuthorizeResponseSerializer(serializers.Serializer):
    """
    Where to send the user, and the state to send back.
    """

    authorization_url = serializers.CharField(read_only=True)
    state = serializers.CharField(read_only=True)


class SocialCallbackSerializer(serializers.Serializer):
    """
    The authorization code and the state it was issued with.
    """

    code = serializers.CharField(
        max_length=2048,
        trim_whitespace=True,
    )

    state = serializers.CharField(
        max_length=128,
        trim_whitespace=True,
    )
