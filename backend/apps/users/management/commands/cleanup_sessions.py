from django.core.management.base import BaseCommand

from apps.users.services.security.cleanup_sessions import (
    cleanup_expired_sessions,
)


class Command(BaseCommand):
    help = "Delete expired user sessions."

    def handle(self, *args, **options):
        deleted = cleanup_expired_sessions()

        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} expired sessions."))
