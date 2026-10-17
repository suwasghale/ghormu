from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    label = "users"
    verbose_name = "Users"

    def ready(self) -> None:
        """
        Register the OpenAPI authentication extension, the system checks
        and any social provider that has been configured.

        No signal receivers are registered here: profile creation is
        owned by apps.profiles, which depends on users rather than the
        other way around.
        """

        import apps.users.api.schema  # noqa: F401
        import apps.users.checks  # noqa: F401
        from apps.users.services.auth.social.google import (
            register_if_configured,
        )

        register_if_configured()
