"""
Serializer fields for public content.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from core.i18n import DEFAULT_LANGUAGE, localized


@extend_schema_field(str)
class LocalizedField(serializers.Field):
    """
    Serialises a pair of ``<field>_fr`` / ``<field>_en`` columns as one value.

    The output key is the bare field name, so the API contract is
    ``{"title": "..."}`` regardless of how it is stored — clients never
    see the pairing, and moving to a translation table later would not
    change a single response.

    Read-only by design: writes go through the admin, which edits both
    columns explicitly.
    """

    def __init__(self, field_name: str | None = None, **kwargs):
        kwargs["read_only"] = True
        kwargs.setdefault("source", "*")
        self._pair_name = field_name
        super().__init__(**kwargs)

    def bind(self, field_name, parent):
        super().bind(field_name, parent)
        # Default the column prefix to the name the field was declared
        # under, so `title = LocalizedField()` just works.
        if self._pair_name is None:
            self._pair_name = field_name

    def to_representation(self, instance):
        language = self.context.get("language", DEFAULT_LANGUAGE)
        return localized(instance, self._pair_name, language=language)


@extend_schema_field(serializers.URLField(allow_null=True))
class AbsoluteImageField(serializers.Field):
    """
    Serialises an ``ImageField`` as an absolute URL, or ``None``.

    ``ImageField.url`` raises when no file is set, which turns an
    optional image into a 500. Optional means optional.
    """

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        if not value:
            return None

        url = value.url
        request = self.context.get("request")

        # With cloud storage the URL is already absolute; with local
        # media it is a path, and the frontend runs on another origin.
        if request is not None and url.startswith("/"):
            return request.build_absolute_uri(url)

        return url
