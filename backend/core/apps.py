from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
    verbose_name = "Core"

    def ready(self) -> None:
        # Importing for the side effect of registering the check. Django
        # only runs checks it knows about, and it only knows about the
        # ones imported by the time `check` runs.
        from core.storage import checks  # noqa: F401
