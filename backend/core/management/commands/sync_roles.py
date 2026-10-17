"""
Apply the declared roles to the database.
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from core.roles import registered_roles, sync_roles


class Command(BaseCommand):
    help = (
        "Create and update Django groups from the roles declared in "
        "core.roles. Safe to run repeatedly."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--prune",
            action="store_true",
            help=(
                "Also delete groups that are no longer declared. Off "
                "by default because deleting a group silently strips "
                "access from everyone in it."
            ),
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing anything.",
        )

    def handle(self, *args, **options) -> None:
        roles = registered_roles()

        if not roles:
            self.stdout.write(
                "No roles are declared. Register them with "
                "core.roles.register_role from an AppConfig.ready().",
            )
            return

        if options["dry_run"]:
            self.stdout.write(f"{len(roles)} role(s) declared:")

            for role in roles:
                self.stdout.write(
                    f"  {role.name}: {len(role.permissions)} permission(s)",
                )

            self.stdout.write(
                self.style.WARNING("Dry run - nothing written."),
            )
            return

        with transaction.atomic():
            report = sync_roles(prune=options["prune"])

        for label in ("created", "updated", "pruned"):
            for name in report[label]:
                self.stdout.write(
                    self.style.SUCCESS(f"{label}: {name}"),
                )

        # Surfaced loudly: a role whose permissions did not resolve
        # looks configured and grants nothing.
        for entry in report["unknown_permissions"]:
            self.stderr.write(
                self.style.ERROR(f"unknown permission: {entry}"),
            )

        if not any(report[k] for k in ("created", "updated", "pruned")):
            self.stdout.write("Roles already up to date.")
