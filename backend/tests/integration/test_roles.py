"""
Declarative roles.
"""

from __future__ import annotations

import pytest
from django.contrib.auth.models import Group, Permission
from django.core.management import call_command

from core.roles import Role, register_role, sync_roles

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _clean_registry():
    """
    The registry is module-level, so it leaks between tests.
    """

    from core import roles

    original = dict(roles._REGISTRY)
    roles._REGISTRY.clear()
    yield
    roles._REGISTRY.clear()
    roles._REGISTRY.update(original)


def _a_real_permission() -> str:
    permission = Permission.objects.select_related(
        "content_type",
    ).first()

    return f"{permission.content_type.app_label}.{permission.codename}"


# ------------------------------------------------------------------------------
# Sync
# ------------------------------------------------------------------------------


def test_sync_creates_the_declared_group():
    register_role(Role(name="support"))

    report = sync_roles()

    assert report["created"] == ["support"]
    assert Group.objects.filter(name="support").exists()


def test_sync_is_idempotent():
    register_role(Role(name="support"))

    sync_roles()
    report = sync_roles()

    assert report["created"] == []
    assert report["updated"] == []
    assert Group.objects.filter(name="support").count() == 1


def test_sync_attaches_permissions():
    codename = _a_real_permission()

    register_role(Role(name="support", permissions=[codename]))

    sync_roles()

    group = Group.objects.get(name="support")

    assert group.permissions.count() == 1


def test_sync_corrects_drift():
    """
    The declaration is the source of truth, so a permission added by
    hand in the admin is removed on the next sync.
    """

    codename = _a_real_permission()

    register_role(Role(name="support", permissions=[codename]))
    sync_roles()

    group = Group.objects.get(name="support")
    group.permissions.clear()

    report = sync_roles()

    assert report["updated"] == ["support"]
    assert group.permissions.count() == 1


def test_unknown_permissions_are_reported_not_ignored():
    """
    A typo would otherwise produce a role that looks configured and
    grants nothing.
    """

    register_role(
        Role(name="support", permissions=["nope.does_not_exist"]),
    )

    report = sync_roles()

    assert report["unknown_permissions"] == [
        "support: nope.does_not_exist",
    ]


def test_pruning_is_opt_in():
    Group.objects.create(name="created-by-hand")

    register_role(Role(name="support"))

    sync_roles()

    assert Group.objects.filter(name="created-by-hand").exists()

    sync_roles(prune=True)

    assert not Group.objects.filter(name="created-by-hand").exists()


def test_a_role_needs_a_name():
    with pytest.raises(ValueError):
        register_role(Role(name=""))


def test_conflicting_redefinition_is_refused():
    register_role(Role(name="support", permissions=["a.b"]))

    with pytest.raises(ValueError):
        register_role(Role(name="support", permissions=["c.d"]))


# ------------------------------------------------------------------------------
# Management command
# ------------------------------------------------------------------------------


def test_command_creates_groups():
    register_role(Role(name="support"))

    call_command("sync_roles")

    assert Group.objects.filter(name="support").exists()


def test_dry_run_writes_nothing():
    register_role(Role(name="support"))

    call_command("sync_roles", "--dry-run")

    assert not Group.objects.filter(name="support").exists()


# ------------------------------------------------------------------------------
# Permission check
# ------------------------------------------------------------------------------


def test_has_role_matches_the_synced_group(user):
    from rest_framework.test import APIRequestFactory

    from core.api.permissions import HasRole

    register_role(Role(name="support"))
    sync_roles()

    request = APIRequestFactory().get("/")
    request.user = user

    permission = HasRole.named("support")()

    assert not permission.has_permission(request, None)

    user.groups.add(Group.objects.get(name="support"))
    del request._group_names

    assert permission.has_permission(request, None)
