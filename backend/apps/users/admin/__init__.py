"""
Admin registrations for the users app.

Django imports this module during startup, so every admin module that
registers a model must be imported here or its registration never runs.
"""

from . import group, user  # noqa: F401
