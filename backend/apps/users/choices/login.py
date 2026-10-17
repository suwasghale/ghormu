from django.db import models


class LoginMethodChoices(models.TextChoices):
    PASSWORD = "password", "Password"
    GOOGLE = "google", "Google"
    GITHUB = "github", "GitHub"
    APPLE = "apple", "Apple"
    MICROSOFT = "microsoft", "Microsoft"
    MAGIC_LINK = "magic_link", "Magic Link"
    API_KEY = "api_key", "API Key"


class RevokeReasonChoices(models.TextChoices):
    MANUAL = "manual", "Manual"
    PASSWORD_CHANGED = "password_changed", "Password Changed"
    ACCOUNT_DELETED = "account_deleted", "Account Deleted"
    ADMIN = "admin", "Admin"
    TOKEN_REUSE = "token_reuse", "Token Reuse"
    EXPIRED = "expired", "Expired"
