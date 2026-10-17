"""
Base views for the public content API.

Everything under ``/api/v1/content/`` is anonymous, read-only and
cacheable. Centralising that here means a new collection is a serializer
and a selector, not another chance to forget ``Cache-Control`` or leave
authentication switched on.
"""

from __future__ import annotations

from rest_framework.permissions import AllowAny

from core.api.base import BaseAPIView
from core.api.throttles import PublicThrottle
from core.i18n import LANGUAGE_QUERY_PARAM, resolve_language

#: Browsers and CDNs may serve a cached copy for this long, and may keep
#: serving a stale one for a day while they refetch in the background.
#: The site is statically rendered and revalidated on publish, so this
#: only shapes direct API traffic.
PUBLIC_CACHE_SECONDS = 300
PUBLIC_STALE_SECONDS = 86_400


class PublicContentAPIView(BaseAPIView):
    """
    Read-only, unauthenticated, language-aware, cacheable.

    Authentication is disabled rather than merely permitted, for the same
    reason ``PublicAPIView`` does it: an expired ``Authorization`` header
    from a logged-in editor browsing the site should not turn a public
    read into a 401.
    """

    authentication_classes = ()

    permission_classes = (AllowAny,)

    throttle_classes = (PublicThrottle,)

    def get_queryset(self):
        # Schema introspection needs model metadata; runtime reads use selectors.
        if getattr(self, "swagger_fake_view", False):
            meta = getattr(self.get_serializer_class(), "Meta", None)
            model = getattr(meta, "model", None)
            if model is not None:
                return model.objects.none()
        return super().get_queryset()

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        context["language"] = self.language
        return context

    @property
    def language(self) -> str:
        """
        The content language for this request.
        """

        return resolve_language(self.request)

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        if request.method in ("GET", "HEAD") and response.status_code < 400:
            response["Cache-Control"] = (
                f"public, max-age={PUBLIC_CACHE_SECONDS}, "
                f"stale-while-revalidate={PUBLIC_STALE_SECONDS}"
            )
            # The same URL yields different bodies per language, so a
            # shared cache must key on both. Without this a French
            # visitor can be served an English response from the CDN.
            response["Vary"] = "Accept-Language"

        return response

    @classmethod
    def language_parameter(cls):
        """
        OpenAPI description of the language selector.
        """

        from drf_spectacular.utils import OpenApiParameter

        return OpenApiParameter(
            name=LANGUAGE_QUERY_PARAM,
            description="Content language: `fr` (default) or `en`.",
            required=False,
            type=str,
            enum=["fr", "en"],
        )
