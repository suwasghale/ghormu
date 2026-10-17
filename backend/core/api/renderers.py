"""
JSON renderer backed by orjson.

orjson is already a project dependency and serialises several times
faster than the standard library encoder, which matters for list
endpoints. It also emits compact output by default.
"""

from __future__ import annotations

import orjson
from rest_framework.renderers import JSONRenderer


class ORJSONRenderer(JSONRenderer):
    """
    Render responses using orjson.
    """

    media_type = "application/json"
    format = "json"
    charset = None

    def render(
        self,
        data,
        accepted_media_type=None,
        renderer_context=None,
    ) -> bytes:
        if data is None:
            return b""

        return orjson.dumps(
            data,
            # UUIDs, datetimes and Decimals reach the renderer already
            # coerced by DRF's serializers, but model instances passed
            # straight through still need a fallback.
            default=str,
            option=orjson.OPT_NON_STR_KEYS,
        )
