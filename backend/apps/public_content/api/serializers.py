"""
Serializers for the public website's content.

Public serializers collapse each ``<field>_ne`` / ``<field>_en`` pair into
one value in the requested language. Admin serializers expose both columns
so an editor can fill them side by side.
"""

from __future__ import annotations

import copy

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.public_content.models import ArchiveItem, Event, Post, Project
from core.api.admin_serializers import PublishableAdminSerializer
from core.api.fields import LocalizedField

# =============================================================================
# Public
# =============================================================================


class PostListSerializer(serializers.ModelSerializer):
    title = LocalizedField()
    summary = LocalizedField()

    class Meta:
        model = Post
        fields = (
            "id",
            "slug",
            "kind",
            "title",
            "summary",
            "image_url",
            "attachment_url",
            "is_pinned",
            "published_at",
        )


class PostDetailSerializer(PostListSerializer):
    body = LocalizedField()

    class Meta(PostListSerializer.Meta):
        fields = (
            *PostListSerializer.Meta.fields,
            "body",
            "updated_at",
        )


class EventSerializer(serializers.ModelSerializer):
    title = LocalizedField()
    description = LocalizedField()
    location = LocalizedField()

    class Meta:
        model = Event
        fields = (
            "id",
            "category",
            "title",
            "description",
            "location",
            "starts_on",
            "ends_on",
            "image_url",
        )


class ProjectSerializer(serializers.ModelSerializer):
    title = LocalizedField()
    summary = LocalizedField()
    funding = LocalizedField()

    class Meta:
        model = Project
        fields = (
            "id",
            "stage",
            "title",
            "summary",
            "funding",
            "budget_npr",
            "progress",
            "started_on",
            "completed_on",
            "image_url",
        )


class ArchiveItemSerializer(serializers.ModelSerializer):
    title = LocalizedField()
    description = LocalizedField()
    date_label = LocalizedField()
    place = LocalizedField()

    class Meta:
        model = ArchiveItem
        fields = (
            "id",
            "slug",
            "kind",
            "title",
            "description",
            "year",
            "date_label",
            "place",
            "credit",
            "image_url",
        )


# =============================================================================
# Admin
# =============================================================================


class ModelCleanMixin:
    """
    Run the model's own ``clean()`` before saving.

    DRF does not call it, so rules that live on the model (no reserved
    slug, consent before publishing, a credit on satellite images) would be
    enforced in the Django admin and silently skipped here.
    """

    def validate(self, attrs):
        attrs = super().validate(attrs)

        instance = copy.copy(self.instance) if self.instance else self.Meta.model()

        for field, value in attrs.items():
            setattr(instance, field, value)

        try:
            instance.clean()
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.message_dict) from error

        return attrs


class _AdminBase(ModelCleanMixin, PublishableAdminSerializer):
    class Meta:
        fields = "__all__"


class PostAdminSerializer(_AdminBase):
    class Meta(_AdminBase.Meta):
        model = Post
        extra_kwargs = {"slug": {"required": False}}


class EventAdminSerializer(_AdminBase):
    class Meta(_AdminBase.Meta):
        model = Event


class ProjectAdminSerializer(_AdminBase):
    class Meta(_AdminBase.Meta):
        model = Project


class ArchiveItemAdminSerializer(_AdminBase):
    class Meta(_AdminBase.Meta):
        model = ArchiveItem
        extra_kwargs = {"slug": {"required": False}}
