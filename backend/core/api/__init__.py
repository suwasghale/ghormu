"""
API building blocks.

Deliberately empty.

This module previously star-imported every submodule. That made
`core.api.base` - and therefore `rest_framework.generics` - load as a
side effect of touching anything in the package, which in turn resolved
`DEFAULT_RENDERER_CLASSES` while `core.api` was still initialising and
raised an ImportError for a renderer that plainly exists.

Import from the specific module instead:

    from core.api.base import AuthenticatedAPIView
    from core.api.responses import SuccessResponse
"""
