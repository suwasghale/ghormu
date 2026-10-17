from rest_framework import serializers


class RevokeSessionSerializer(serializers.Serializer):
    """
    Request serializer for revoking a session.
    """

    session_id = serializers.UUIDField()
