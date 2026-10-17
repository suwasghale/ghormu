from datetime import timedelta

from config.settings.env import env, env_str

JWT_ACCESS_MINUTES = env.int("JWT_ACCESS_MINUTES", default=15)
JWT_REFRESH_DAYS = env.int("JWT_REFRESH_DAYS", default=7)
JWT_ROTATE_REFRESH_TOKENS = env.bool("JWT_ROTATE_REFRESH_TOKENS", default=True)
JWT_BLACKLIST_AFTER_ROTATION = env.bool("JWT_BLACKLIST_AFTER_ROTATION", default=True)
JWT_UPDATE_LAST_LOGIN = env.bool("JWT_UPDATE_LAST_LOGIN", default=True)
JWT_ALGORITHM = env("JWT_ALGORITHM", default="HS256")
# Blank means "use SECRET_KEY", not "sign with an empty key".
JWT_SIGNING_KEY = env_str(
    "JWT_SIGNING_KEY",
    default=env("SECRET_KEY"),
)
JWT_AUDIENCE = env("JWT_AUDIENCE", default="") or None
JWT_ISSUER = env("JWT_ISSUER", default="") or None

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_DAYS),
    "ROTATE_REFRESH_TOKENS": JWT_ROTATE_REFRESH_TOKENS,
    "BLACKLIST_AFTER_ROTATION": JWT_BLACKLIST_AFTER_ROTATION,
    "UPDATE_LAST_LOGIN": JWT_UPDATE_LAST_LOGIN,
    "ALGORITHM": JWT_ALGORITHM,
    "SIGNING_KEY": JWT_SIGNING_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": JWT_AUDIENCE,
    "ISSUER": JWT_ISSUER,
    "LEEWAY": env.int("JWT_LEEWAY", default=0),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    # Embeds a hash of the password in every token and verifies it on
    # each request, so changing a password invalidates tokens issued
    # before the change without any extra bookkeeping.
    "CHECK_REVOKE_TOKEN": True,
    "REVOKE_TOKEN_CLAIM": "hash_password",
}
