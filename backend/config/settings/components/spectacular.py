from config.settings.env import APP_NAME, env, env_str

API_TITLE = env_str("API_TITLE", default=f"{APP_NAME} API")
API_DESCRIPTION = env(
    "API_DESCRIPTION",
    default=f"REST API for {APP_NAME}.",
)
API_VERSION = env("API_VERSION", default="v1")
API_TERMS = env("API_TERMS_URL", default="")
API_CONTACT_NAME = env("API_CONTACT_NAME", default=APP_NAME)
API_CONTACT_EMAIL = env("API_CONTACT_EMAIL", default="")
API_CONTACT_URL = env("API_CONTACT_URL", default="")
API_LICENSE_NAME = env("API_LICENSE_NAME", default="Proprietary")
API_LICENSE_URL = env("API_LICENSE_URL", default="")
API_SERVER_URL = env("API_SERVER_URL", default="http://localhost:8000")

# Serve the Swagger and ReDoc explorers. The raw schema at
# /api/schema/ is always available; these are the HTML UIs on top
# of it, which a production deployment usually does not need.
ENABLE_API_DOCS = env.bool("ENABLE_API_DOCS", default=True)

SPECTACULAR_SETTINGS = {
    "TITLE": API_TITLE,
    "DESCRIPTION": API_DESCRIPTION,
    "VERSION": API_VERSION,
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_PUBLIC": True,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]",
    "COMPONENT_SPLIT_REQUEST": True,
    "COMPONENT_SPLIT_PATCH": True,
    "SORT_OPERATIONS": True,
    "SORT_OPERATION_PARAMETERS": True,
    "CAMELIZE_NAMES": False,
    "ENUM_ADD_EXPLICIT_BLANK_NULL_CHOICE": False,
    # django-countries exposes the same country list through two
    # fields, which generates two identically-shaped enums with
    # different names. Pin one.
    "ENUM_NAME_OVERRIDES": {
        "CountryEnum": "django_countries.countries",
        # Three unrelated "status" choice sets now exist: publication
        # state, sponsorship state and submission triage. Named here so
        # generated clients get PublicationStatusEnum rather than the
        # hash-suffixed "Status202Enum" spectacular falls back to.
        "PublicationStatusEnum": "core.choices.PublicationStatusChoices",
        # Same story for the three unrelated "category" fields.
        # Two unrelated "kind" fields, and one language list used by both
        # profiles and the contact form.
        "PostKindEnum": "apps.public_content.choices.PostKindChoices",
        "ArchiveKindEnum": "apps.public_content.choices.ArchiveKindChoices",
        "LanguageEnum": "core.choices.LanguageChoices",
    },
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "displayRequestDuration": True,
        "persistAuthorization": True,
        "filter": True,
        "tryItOutEnabled": True,
    },
    "REDOC_UI_SETTINGS": {
        "hideDownloadButton": False,
    },
    "CONTACT": {
        "name": API_CONTACT_NAME,
        "email": API_CONTACT_EMAIL,
        "url": API_CONTACT_URL,
    },
    "LICENSE": {
        "name": API_LICENSE_NAME,
        "url": API_LICENSE_URL,
    },
    "TERMS_OF_SERVICE": API_TERMS,
    "SERVERS": [
        {
            "url": API_SERVER_URL,
            "description": "Current API Server",
        },
    ],
    # NOTE: a hand-written "BearerAuth" scheme used to be declared here
    # and applied globally via SECURITY. That attached an auth
    # requirement to every path including login and registration, which
    # need none, while the real authentication class resolved to no
    # scheme at all.
    #
    # The scheme is now derived from the authentication class itself by
    # apps/users/api/schema.py, so each endpoint advertises exactly what
    # it actually requires.
    # Only tags that endpoints actually use. Listing tags for apps that
    # do not exist yet renders empty sections in the docs and makes the
    # API look larger than it is.
    "TAGS": [
        {
            "name": "Authentication",
            "description": (
                "Registration, sign-in, token rotation and password management."
            ),
        },
        {
            "name": "Account",
            "description": "The authenticated user's own profile.",
        },
        {
            "name": "Address",
            "description": "The authenticated user's addresses.",
        },
        {
            "name": "Security",
            "description": "Active sessions and trusted devices.",
        },
        {
            "name": "Health",
            "description": "Liveness and readiness probes.",
        },
    ],
}
