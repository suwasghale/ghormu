from urllib.parse import urlencode

from django.conf import settings


def build_email_verification_url(
    *,
    token: str,
) -> str:
    return f"{settings.FRONTEND_URL}/verify-email?{urlencode({'token': token})}"
