"""
Image uploads for the admin.

    POST /api/v1/admin/media/     multipart: file

Returns the stored URL. The admin form then writes that URL into the
row's ``image_url`` column, which every content model already has
alongside its ``ImageField`` — so there is no new model, no migration,
and one upload path serves projects, blog, sponsorship, gallery,
partners and team alike.

Bytes go to Django's configured default storage: the local ``media/``
directory in development, the ``ghormu-media`` R2 bucket wherever
``USE_CLOUD_STORAGE`` is on.

Two things this deliberately does not trust:

* **The filename.** Stored objects are named from a UUID. A client
  controls the original, and it can carry path separators, a second
  extension, or 3 KB of Unicode.

* **The Content-Type header.** ``process_image`` decodes the file and
  takes the format from the decoder, so a ``.png`` that is really
  something else is rejected on its bytes rather than its label.

This module lives in ``core`` rather than an app because it needs
nothing from one — only ``core.storage`` and Django's storage API.
"""

from __future__ import annotations

import posixpath
import uuid
from datetime import UTC, datetime

from django.core.files.storage import default_storage
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.parsers import FormParser, MultiPartParser

from core.api.admin import AdminAPIView
from core.api.responses import SuccessResponse
from core.storage.images import InvalidImage, process_image

#: Largest upload accepted, before decoding. Anything above this is
#: refused on Content-Length rather than buffered into memory first.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

#: Editorial images are bounded, not cropped: a landscape gallery photo
#: forced into a square loses most of the frame. 2000px on the long edge
#: is larger than any slot the site renders, retina included.
MAX_DIMENSIONS = (2000, 2000)

#: Everything is re-encoded to WebP. It is smaller than JPEG at the same
#: quality, and normalising the format means the frontend never has to
#: reason about what an editor happened to upload.
OUTPUT_QUALITY = 88


class MediaUploadSerializer(serializers.Serializer):
    """
    Validates the envelope; ``process_image`` validates the bytes.
    """

    file = serializers.ImageField()

    def validate_file(self, value):
        if value.size > MAX_UPLOAD_BYTES:
            megabytes = MAX_UPLOAD_BYTES // (1024 * 1024)

            raise serializers.ValidationError(
                f"L'image ne doit pas dépasser {megabytes} Mo.",
            )

        return value


class AdminMediaUploadAPIView(AdminAPIView):
    """
    Accept one image and return where it was stored.
    """

    serializer_class = MediaUploadSerializer

    parser_classes = (MultiPartParser, FormParser)

    @extend_schema(
        summary="Upload an image",
        request=MediaUploadSerializer,
        responses={201: None},
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["file"]

        try:
            processed = process_image(
                image_file=upload,
                size=MAX_DIMENSIONS,
                quality=OUTPUT_QUALITY,
                fit="contain",
            )
        except InvalidImage as error:
            # A decode failure is the editor's problem to fix, not a
            # server fault: say which file and why, as a field error the
            # form can render next to the input.
            raise serializers.ValidationError({"file": [str(error)]}) from error

        stored = default_storage.save(self._object_name(), processed)

        return SuccessResponse.created(
            message="Image téléversée.",
            data={
                "url": self._absolute(default_storage.url(stored)),
                "name": stored,
                "size": processed.size,
            },
        )

    # ------------------------------------------------------------------

    @staticmethod
    def _object_name() -> str:
        """
        ``uploads/2026/08/<uuid>.webp``.

        Dated folders keep the bucket listable by hand; the UUID makes
        collisions impossible without consulting storage first.
        """

        today = datetime.now(UTC)

        return posixpath.join(
            "uploads",
            f"{today:%Y}",
            f"{today:%m}",
            f"{uuid.uuid4().hex}.webp",
        )

    def _absolute(self, url: str) -> str:
        # R2 hands back an absolute URL already; local media is a path,
        # and the admin runs on a different origin.
        if url.startswith("http"):
            return url

        return self.request.build_absolute_uri(url)
