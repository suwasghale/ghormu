"""
Serializer for avatar uploads.
"""

from __future__ import annotations

from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from apps.profiles.constants import AVATAR_MAX_FILE_SIZE


class AvatarUploadSerializer(serializers.Serializer):
    """
    Validate an uploaded avatar image.
    """

    avatar = serializers.ImageField(
        required=True,
    )

    def validate_avatar(
        self,
        value: UploadedFile,
    ) -> UploadedFile:
        """
        Reject uploads that are too large to be worth decoding.

        Only the size is checked here. The format check that used to
        live alongside it read `value.content_type`, which is supplied
        by the client and can claim anything; it is not evidence about
        the bytes. The real format check happens in
        `core.storage.images.process_image`, which inspects the file
        itself.
        """

        if value.size > AVATAR_MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"Avatar must be smaller than "
                f"{AVATAR_MAX_FILE_SIZE // (1024 * 1024)} MB.",
            )

        return value
