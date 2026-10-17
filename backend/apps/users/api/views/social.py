"""
Social sign-in endpoints.

Two steps, matching the OAuth authorization-code flow:

    POST /auth/social/{provider}/authorize/  -> where to send the user
    POST /auth/social/{provider}/callback/   -> code + state -> tokens

The callback is a POST taking the code in the body rather than a GET
handling the provider's redirect directly. The provider redirects the
browser to the *frontend*, which forwards the code here. That keeps the
authorization code out of this service's access logs and out of the
Referer header, and leaves the frontend in control of the redirect.
"""

from __future__ import annotations

import logging

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.login_response import (
    LoginResponseSerializer,
)
from apps.users.api.serializers.social import (
    SocialAuthorizeRequestSerializer,
    SocialAuthorizeResponseSerializer,
    SocialCallbackSerializer,
    SocialProviderListSerializer,
)
from apps.users.exceptions.authentication import (
    SocialExchangeFailed,
    SocialProviderUnknown,
)
from apps.users.services.auth.social import (
    available_providers,
    consume_state,
    get_provider,
    issue_state,
)
from apps.users.services.auth.social.login import (
    login_with_social_profile,
)
from core.api.base import PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    not_found_schema,
    success_schema,
    too_many_requests_schema,
)
from core.api.throttles import LoginThrottle

logger = logging.getLogger(__name__)


@extend_schema(
    tags=["Authentication"],
    summary="List configured sign-in providers",
    responses={
        200: success_schema(
            description="Providers retrieved.",
            response=SocialProviderListSerializer,
        ),
    },
)
class SocialProviderListAPIView(PublicAPIView):
    """
    Which social providers this deployment has configured.
    """

    serializer_class = SocialProviderListSerializer

    def get(self, request: Request, *args, **kwargs) -> Response:
        return SuccessResponse.ok(
            message="Providers retrieved.",
            data=SocialProviderListSerializer(
                {"providers": available_providers()},
            ).data,
        )


@extend_schema(
    tags=["Authentication"],
    summary="Begin social sign-in",
    description=(
        "Returns the provider URL to send the user to, plus the state "
        "value that must come back with the callback."
    ),
    request=SocialAuthorizeRequestSerializer,
    responses={
        200: success_schema(
            description="Authorization URL generated.",
            response=SocialAuthorizeResponseSerializer,
        ),
        404: not_found_schema(),
        429: too_many_requests_schema(),
    },
)
class SocialAuthorizeAPIView(PublicAPIView):
    """
    Start the authorization-code flow.
    """

    serializer_class = SocialAuthorizeRequestSerializer
    throttle_classes = (LoginThrottle,)

    def post(
        self,
        request: Request,
        provider: str,
        *args,
        **kwargs,
    ) -> Response:
        implementation = get_provider(provider)

        if implementation is None:
            raise SocialProviderUnknown()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        redirect_uri = serializer.validated_data["redirect_uri"]

        state = issue_state(
            provider=provider,
            redirect_uri=redirect_uri,
        )

        return SuccessResponse.ok(
            message="Authorization URL generated.",
            data=SocialAuthorizeResponseSerializer(
                {
                    "authorization_url": (
                        implementation.build_authorization_url(
                            state=state,
                            redirect_uri=redirect_uri,
                        )
                    ),
                    "state": state,
                },
            ).data,
        )


@extend_schema(
    tags=["Authentication"],
    summary="Complete social sign-in",
    description=(
        "Exchanges an authorization code for a session. The `state` "
        "must match the one issued by the authorize step."
    ),
    request=SocialCallbackSerializer,
    responses={
        200: success_schema(
            description="Sign-in successful.",
            response=LoginResponseSerializer,
        ),
        400: bad_request_schema(),
        404: not_found_schema(),
        429: too_many_requests_schema(),
    },
)
class SocialCallbackAPIView(PublicAPIView):
    """
    Exchange an authorization code for tokens.
    """

    serializer_class = SocialCallbackSerializer
    throttle_classes = (LoginThrottle,)

    def post(
        self,
        request: Request,
        provider: str,
        *args,
        **kwargs,
    ) -> Response:
        implementation = get_provider(provider)

        if implementation is None:
            raise SocialProviderUnknown()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ----------------------------------------------------------------------
        # State
        #
        # Single-use and bound to the provider and redirect URI it was
        # issued for. Skipping this lets an attacker complete their own
        # authorization and feed the resulting code to a victim's
        # browser, linking the victim's session to the attacker's
        # account.
        # ----------------------------------------------------------------------

        issued = consume_state(
            state=serializer.validated_data["state"],
        )

        if issued is None or issued.get("provider") != provider:
            raise SocialExchangeFailed(
                "This sign-in attempt has expired. Please try again.",
            )

        redirect_uri = issued["redirect_uri"]

        # ----------------------------------------------------------------------
        # Exchange
        # ----------------------------------------------------------------------

        try:
            tokens = implementation.exchange_code(
                code=serializer.validated_data["code"],
                redirect_uri=redirect_uri,
            )

            profile = implementation.fetch_profile(tokens=tokens)

        except Exception as exc:
            # Provider errors carry request identifiers and sometimes
            # the client secret in the echoed request, so the detail is
            # logged rather than returned.
            logger.warning(
                "Social exchange failed for provider %r.",
                provider,
                exc_info=True,
            )

            raise SocialExchangeFailed() from exc

        result = login_with_social_profile(
            request=request,
            profile=profile,
            provider_verifies_email=implementation.verifies_email,
        )

        return SuccessResponse.ok(
            message="Login successful.",
            data=LoginResponseSerializer(result).data,
        )
