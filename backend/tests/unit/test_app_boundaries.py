"""
App dependency direction.

The point of splitting profiles out of users is that the auth app can be
reused, or the profiles app deleted, without either breaking. That only
holds while the dependency points one way, and nothing enforces it at
runtime - so it is asserted here.

These are static import checks: no database, no Django needed.
"""

from __future__ import annotations

import ast
import pathlib

import pytest

BACKEND = pathlib.Path(__file__).resolve().parents[2]


def _local_apps() -> list[str]:
    """
    Every app under apps/, discovered rather than listed.

    Hardcoding the app names meant a newly added app got no dependency
    checking at all - which, in a template whose whole purpose is adding
    apps, is the case that matters most.
    """

    root = BACKEND / "apps"

    return sorted(
        f"apps.{path.name}"
        for path in root.iterdir()
        if path.is_dir() and (path / "__init__.py").exists()
    )


def _imported_modules(package: str) -> set[str]:
    """
    Return every module imported anywhere under `package`.
    """

    root = BACKEND / package.replace(".", "/")
    found: set[str] = set()

    for path in root.rglob("*.py"):
        if "migrations" in path.parts:
            continue

        tree = ast.parse(path.read_text(encoding="utf-8"), str(path))

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                found.update(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                # Relative imports stay inside the package.
                if node.level == 0:
                    found.add(node.module)

    return found


def test_users_does_not_import_profiles():
    """
    The auth app must stand alone. If it reaches into profiles, then
    forking it means dragging a Profile and an Address model along, and
    deleting profiles breaks authentication.
    """

    offenders = sorted(
        m for m in _imported_modules("apps.users") if m.startswith("apps.profiles")
    )

    assert not offenders, "apps.users imports from apps.profiles: " + ", ".join(
        offenders
    )


def test_users_does_not_import_any_other_local_app():
    offenders = sorted(
        m
        for m in _imported_modules("apps.users")
        if m.startswith("apps.") and not m.startswith("apps.users")
    )

    assert not offenders, "apps.users imports another local app: " + ", ".join(
        offenders
    )


def test_profiles_may_import_users():
    """
    The permitted direction. Asserted so that inverting the dependency
    later is a deliberate act rather than an accident.
    """

    imported = _imported_modules("apps.profiles")

    assert any(m.startswith("apps.users") for m in imported)


def test_core_does_not_import_any_app():
    """
    core/ is the shared foundation. An import from apps/ there makes it
    unusable by a second project and inverts the layering.

    The JWT authentication class and the lockout backend used to live
    here and both reached into apps.users. They now live in that app,
    which is where their dependencies already were.
    """

    root = BACKEND / "core"
    offenders: list[str] = []

    for path in root.rglob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"), str(path))

        for node in ast.walk(tree):
            modules = []
            if isinstance(node, ast.Import):
                modules = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                modules = [node.module]

            for module in modules:
                if module.startswith("apps."):
                    offenders.append(f"{path.relative_to(BACKEND)}: {module}")

    assert not offenders, "core imports from apps:\n" + "\n".join(offenders)


def test_no_two_apps_import_each_other():
    """
    Dependencies between apps must form a tree, not a cycle.

    Two apps importing each other cannot be reasoned about, deployed
    apart, or deleted independently - and Django will happily let it
    happen until an import order changes and it breaks at startup.
    """

    graph = {
        app: {
            other
            for other in _local_apps()
            if other != app
            and any(
                imported == other or imported.startswith(other + ".")
                for imported in _imported_modules(app)
            )
        }
        for app in _local_apps()
    }

    cycles = sorted(
        f"{app} <-> {other}"
        for app, dependencies in graph.items()
        for other in dependencies
        if app in graph.get(other, set())
    )

    assert not cycles, "circular app dependencies: " + ", ".join(cycles)


@pytest.mark.parametrize("package", _local_apps())
def test_app_has_no_circular_self_reference_via_core(package):
    """
    core must not be imported back through an app's public surface in a
    way that recreates the cycle the api package once had.
    """

    imported = _imported_modules(package)

    assert "core.api" not in imported, (
        f"{package} imports the core.api package rather than a "
        "specific module, which reintroduces the eager-import cycle"
    )


def test_auth_app_boots_without_the_profiles_app():
    """
    The end-to-end version of the claim: a fork that deletes
    apps/profiles must still start, migrate and route.

    Run in a subprocess because INSTALLED_APPS cannot meaningfully be
    changed inside a running Django process.
    """

    import subprocess
    import sys

    result = subprocess.run(
        [
            sys.executable,
            "manage.py",
            "check",
        ],
        cwd=BACKEND,
        env={
            **__import__("os").environ,
            "DJANGO_SETTINGS_MODULE": "config.settings._no_profiles",
        },
        capture_output=True,
        text=True,
        timeout=120,
    )

    assert result.returncode == 0, (
        f"authentication does not stand alone:\n{result.stdout}\n{result.stderr}"
    )
