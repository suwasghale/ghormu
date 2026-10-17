"""
Query selectors for the users app.

Deliberately empty: import from the specific module.

    from apps.users.selectors.user import find_user_by_email

Star-importing submodules here made every selector load as a side
effect of touching any one of them, and turned a moved module into an
ImportError at startup rather than at its call site.
"""
