"""
Logout serializer.
"""

from rest_framework import serializers


class LogoutSerializer(serializers.Serializer):
    """
    Logout request.
    """

    refresh = serializers.CharField()
