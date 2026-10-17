"""
Django REST Framework configuration.
"""

from config.settings.env import env

# =============================================================================
# Pagination
# =============================================================================

API_PAGE_SIZE = env.int(
    "API_PAGE_SIZE",
    default=20,
)

MAX_API_PAGE_SIZE = env.int(
    "MAX_API_PAGE_SIZE",
    default=100,
)

# =============================================================================
# Renderer
# =============================================================================

# The browsable API renders a writable HTML form for every endpoint and
# is considerably slower than plain JSON. Off unless explicitly enabled.
ENABLE_BROWSABLE_API = env.bool(
    "ENABLE_BROWSABLE_API",
    default=False,
)

# The browsable API is HTML-form driven and needs session authentication
# to be usable. Outside of it, session auth on a JWT API only widens the
# CSRF surface, so it is enabled together with the browsable renderer.
ENABLE_SESSION_AUTHENTICATION = env.bool(
    "ENABLE_SESSION_AUTHENTICATION",
    default=ENABLE_BROWSABLE_API,
)

# =============================================================================
# Throttling
# =============================================================================

DEFAULT_THROTTLE_RATES = {
    # Global backstops applied to every endpoint that does not declare
    # its own throttle classes.
    "anon": env(
        "DRF_THROTTLE_ANON",
        default="60/minute",
    ),
    "user": env(
        "DRF_THROTTLE_USER",
        default="1000/hour",
    ),
    # Capability scopes.
    "public": env(
        "DRF_THROTTLE_PUBLIC",
        default="300/hour",
    ),
    # Both public forms share this bucket. Low, because a person sends
    # one contact message or one sponsorship request — five an hour from
    # one address is already generous, and the ceiling is what stops the
    # forms being used as a mail relay.
    "submission": env(
        "DRF_THROTTLE_SUBMISSION",
        default="5/hour",
    ),
    "login": env(
        "DRF_THROTTLE_LOGIN",
        default="10/minute",
    ),
    "password_reset": env(
        "DRF_THROTTLE_PASSWORD_RESET",
        default="10/hour",
    ),
    "password_reset_confirm": env(
        "DRF_THROTTLE_PASSWORD_RESET_CONFIRM",
        default="10/hour",
    ),
    "email_verification": env(
        "DRF_THROTTLE_EMAIL_VERIFICATION",
        default="20/hour",
    ),
    "email_verification_resend": env(
        "DRF_THROTTLE_EMAIL_VERIFICATION_RESEND",
        default="5/hour",
    ),
    "registration": env(
        "DRF_THROTTLE_REGISTRATION",
        default="5/hour",
    ),
    "token_refresh": env(
        "DRF_THROTTLE_TOKEN_REFRESH",
        default="60/hour",
    ),
    "authenticated": env(
        "DRF_THROTTLE_AUTHENTICATED",
        default="1000/day",
    ),
    "password_change": env(
        "DRF_THROTTLE_PASSWORD_CHANGE",
        default="10/hour",
    ),
    "email_change": env(
        "DRF_THROTTLE_EMAIL_CHANGE",
        default="5/hour",
    ),
    "account_delete": env(
        "DRF_THROTTLE_ACCOUNT_DELETE",
        default="5/hour",
    ),
    "mfa": env(
        "DRF_THROTTLE_MFA",
        default="20/hour",
    ),
    "mfa_verify": env(
        "DRF_THROTTLE_MFA_VERIFY",
        default="10/minute",
    ),
}

# =============================================================================
# Authentication classes
# =============================================================================

DEFAULT_AUTHENTICATION_CLASSES = [
    "apps.users.authentication.SessionAwareJWTAuthentication",
]

if ENABLE_SESSION_AUTHENTICATION:
    DEFAULT_AUTHENTICATION_CLASSES.append(
        "rest_framework.authentication.SessionAuthentication",
    )

# =============================================================================
# Renderer classes
# =============================================================================

DEFAULT_RENDERER_CLASSES = [
    "core.api.renderers.ORJSONRenderer",
]

if ENABLE_BROWSABLE_API:
    DEFAULT_RENDERER_CLASSES.append(
        "rest_framework.renderers.BrowsableAPIRenderer",
    )

# =============================================================================
# REST Framework
# =============================================================================

REST_FRAMEWORK = {
    # Authentication
    "DEFAULT_AUTHENTICATION_CLASSES": tuple(
        DEFAULT_AUTHENTICATION_CLASSES,
    ),
    # Permissions
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    # Renderers
    "DEFAULT_RENDERER_CLASSES": tuple(
        DEFAULT_RENDERER_CLASSES,
    ),
    # Parsers
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ),
    # Pagination
    "DEFAULT_PAGINATION_CLASS": ("core.api.pagination.StandardPagination"),
    "PAGE_SIZE": API_PAGE_SIZE,
    # Filtering
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # OpenAPI
    "DEFAULT_SCHEMA_CLASS": ("drf_spectacular.openapi.AutoSchema"),
    # Versioning
    "DEFAULT_VERSIONING_CLASS": ("rest_framework.versioning.NamespaceVersioning"),
    # Throttling. Every endpoint inherits a baseline limit; views that
    # need a tighter budget declare their own throttle_classes.
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": DEFAULT_THROTTLE_RATES,
    # Exception handler
    "EXCEPTION_HANDLER": ("core.api.exceptions.custom_exception_handler"),
    # Testing
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
    # Search & Ordering
    "SEARCH_PARAM": "search",
    "ORDERING_PARAM": "ordering",
    # JSON
    "COERCE_DECIMAL_TO_STRING": True,
    "UNICODE_JSON": True,
    "COMPACT_JSON": True,
}
