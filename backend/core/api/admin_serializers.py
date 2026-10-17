"""
Serializer base for the admin API.

The public serializers collapse each ``<field>_fr`` / ``<field>_en``
pair into one localised value. The admin does the opposite: an editor
needs both columns, side by side, so admin serializers work on the raw
model fields and let ``ModelSerializer`` derive validation from them.

What this base adds on top of ``ModelSerializer``:

* Audit columns (``id``, ``created_at``, ``updated_at``) are always
  read-only, whatever a subclass lists in ``fields``.
* Uploaded images are echoed back as absolute URLs, because the admin
  UI runs on a different origin from the media server.
* ``status`` and ``published_at`` stay consistent with each other, so a
  row cannot be "published" with no publication date.
"""

from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from core.choices import PublicationStatusChoices

#: Columns the database owns. A client may send them; they are ignored.
AUDIT_FIELDS = ("id", "created_at", "updated_at")


class AdminModelSerializer(serializers.ModelSerializer):
    """
    Base for every admin resource serializer.
    """

    def get_fields(self):
        fields = super().get_fields()

        for name in AUDIT_FIELDS:
            if name in fields:
                fields[name].read_only = True

        return fields

    # ------------------------------------------------------------------
    # Absolute media URLs
    # ------------------------------------------------------------------

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get("request")

        if request is None:
            return data

        for key, value in data.items():
            # DRF renders FileField as a path when no request is in
            # context and as a URL when there is; normalise either way.
            if isinstance(value, str) and value.startswith("/media/"):
                data[key] = request.build_absolute_uri(value)

        return data


class ImagePreviewMixin(serializers.Serializer):
    """
    Adds a read-only ``preview`` URL for the admin list's thumbnails.

    Every image-bearing model already resolves "uploaded file first,
    external URL second" behind one property, but they do not agree on
    its name — ``photo_url``, ``logo_url``, ``cover_image_url``. The
    subclass names the property; this resolves it to an absolute URL.

    Needed because ``fields = "__all__"`` serialises the raw ``image``
    column, which is empty for every row whose picture is an external
    URL — so the admin list showed no thumbnails at all.
    """

    #: Name of the model property that resolves the image.
    preview_source = "photo_url"

    preview = serializers.SerializerMethodField()

    def get_preview(self, instance) -> str | None:
        url = getattr(instance, self.preview_source, "") or ""

        if not url:
            return None

        request = self.context.get("request")

        # Local media is a path and the admin runs on another origin;
        # cloud storage already hands back an absolute URL.
        if request is not None and url.startswith("/"):
            return request.build_absolute_uri(url)

        return url


class PublishableAdminSerializer(AdminModelSerializer):
    """
    Adds publication-lifecycle rules.

    Two invariants, enforced here rather than in the model so the API
    can explain them and the Django admin keeps its own behaviour:

    * Publishing without a date stamps *now*. Otherwise a row is
      published but sorts as though it never was, and any query
      ordering by ``published_at`` silently drops it.

    * Moving back to draft leaves the date alone. It is a record of
      when the row first went live, and re-publishing should not look
      like a brand-new post.
    """

    def validate(self, attrs):
        attrs = super().validate(attrs)

        status = attrs.get(
            "status",
            getattr(self.instance, "status", None),
        )

        if status != PublicationStatusChoices.PUBLISHED:
            return attrs

        already_set = attrs.get(
            "published_at",
            getattr(self.instance, "published_at", None),
        )

        if not already_set:
            attrs["published_at"] = timezone.now()

        return attrs
