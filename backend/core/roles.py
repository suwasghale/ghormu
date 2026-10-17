"""
Declarative roles on top of Django's group and permission system.

Django already has groups and per-model permissions. What it lacks is a
way to *declare* which groups should exist and what they contain, so in
practice they get created by hand in the admin - which means staging and
production drift, and a fresh database has none of them.

A role here is a name plus a set of permission codenames. `sync_roles`
makes the database match the declaration: it creates missing groups and
corrects their permissions. Declaration is the source of truth, so the
roles are reviewed in code and applied by a deploy step, not clicked
into an admin form.

    from core.roles import Role, register_role

    register_role(
        Role(
            name="support",
            description="Read-only access to user records.",
            permissions=["users.view_user", "profiles.view_profile"],
        )
    )

Then `python manage.py sync_roles`, or call it from a data migration.

Deliberately *not* a new model. Adding a Role table alongside Group
means two sources of truth and no help from Django's admin, permission
checks or `user.has_perm`.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class Role:
    """
    A named set of permissions.

    Attributes:
        name:
            Becomes the Django Group name. Referenced by
            `HasGroup.named(...)`.

        description:
            For humans; not stored, since Group has nowhere to put it.

        permissions:
            Codenames as ``"<app_label>.<codename>"``. Unknown entries
            are reported by `sync_roles` rather than silently skipped -
            a typo in a permission name otherwise produces a role that
            looks right and grants nothing.
    """

    name: str
    description: str = ""
    permissions: tuple[str, ...] | list[str] = field(
        default_factory=tuple,
    )


_REGISTRY: dict[str, Role] = {}


def register_role(role: Role) -> None:
    """
    Declare a role.

    Call from `AppConfig.ready` so roles are registered wherever the
    app that owns them lives.
    """

    if not role.name:
        raise ValueError("A role needs a name.")

    if role.name in _REGISTRY and _REGISTRY[role.name] != role:
        raise ValueError(
            f"Role {role.name!r} is already registered with a different definition.",
        )

    _REGISTRY[role.name] = role


def registered_roles() -> list[Role]:
    """
    Every declared role, by name.
    """

    return [_REGISTRY[name] for name in sorted(_REGISTRY)]


def get_role(name: str) -> Role | None:
    return _REGISTRY.get(name)


def sync_roles(*, prune: bool = False) -> dict[str, list[str]]:
    """
    Make the database match the declared roles.

    Args:
        prune:
            Also delete groups that are no longer declared. Off by
            default: a project may legitimately create groups outside
            this registry, and deleting one silently strips access from
            everyone in it.

    Returns:
        A report keyed by ``created``, ``updated``, ``unknown_permissions``
        and ``pruned``.
    """

    from django.contrib.auth.models import Group, Permission

    report: dict[str, list[str]] = {
        "created": [],
        "updated": [],
        "unknown_permissions": [],
        "pruned": [],
    }

    # One query for every permission, rather than one per codename.
    known = {
        f"{app_label}.{codename}": permission_id
        for permission_id, app_label, codename in Permission.objects.values_list(
            "id",
            "content_type__app_label",
            "codename",
        )
    }

    for role in registered_roles():
        group, created = Group.objects.get_or_create(name=role.name)

        if created:
            report["created"].append(role.name)

        wanted_ids = set()

        for codename in role.permissions:
            permission_id = known.get(codename)

            if permission_id is None:
                # Reported, not ignored: a typo here produces a role
                # that looks correct and grants nothing.
                report["unknown_permissions"].append(
                    f"{role.name}: {codename}",
                )
                continue

            wanted_ids.add(permission_id)

        current_ids = set(
            group.permissions.values_list("id", flat=True),
        )

        if current_ids != wanted_ids:
            group.permissions.set(wanted_ids)

            if not created:
                report["updated"].append(role.name)

    if prune:
        declared = set(_REGISTRY)

        stale = Group.objects.exclude(name__in=declared)

        report["pruned"] = list(
            stale.values_list("name", flat=True),
        )

        stale.delete()

    return report
