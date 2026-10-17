"""
Serializer for logout all devices.
"""

from __future__ import annotations

from rest_framework import serializers


class LogoutAllSerializer(serializers.Serializer):
    """
    Logout from all devices.

    This endpoint currently accepts no request body.
    """

    pass
