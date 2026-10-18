"""
Contact form input, and the staff view of messages.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.contact.models import ContactMessage, ContactTopicChoices
from core.api.admin_serializers import AdminModelSerializer
from core.choices import LanguageChoices


class ContactSubmissionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, trim_whitespace=True)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(
        required=False, allow_blank=True, max_length=40, default=""
    )
    topic = serializers.ChoiceField(
        choices=ContactTopicChoices.choices, default=ContactTopicChoices.GENERAL
    )
    message = serializers.CharField(min_length=10, max_length=5000)
    language = serializers.ChoiceField(
        choices=LanguageChoices.choices, default=LanguageChoices.NE
    )

    #: Hidden from people, irresistible to bots. Anything here is spam.
    website = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_phone(self, value: str) -> str:
        digits = [char for char in value if char.isdigit()]

        if value and not 7 <= len(digits) <= 15:
            raise serializers.ValidationError("Enter a valid phone number.")

        return value

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError(
                {"email": "Give an email or a phone number so we can reply."}
            )

        return attrs


class ContactMessageAdminSerializer(AdminModelSerializer):
    """
    Staff can mark a message handled and keep a note; what the sender wrote
    is a record and stays as sent.
    """

    class Meta:
        model = ContactMessage
        fields = "__all__"
        read_only_fields = ("name", "email", "phone", "topic", "message", "language")
