"""
Serializer for resending an email verification.
"""

from __future__ import annotations

from rest_framework import serializers


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
