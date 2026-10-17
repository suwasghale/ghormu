"""
Multi-factor authentication endpoints.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from apps.users.api.serializers.auth.login_response import (
    LoginResponseSerializer,
)
from apps.users.api.serializers.mfa import (
    MFACodeSerializer,
    MFADisableSerializer,
    MFAEnrolStartResponseSerializer,
    MFAStatusSerializer,
    MFAVerifySerializer,
    RecoveryCodesResponseSerializer,
)
from apps.users.exceptions.authentication import CurrentPasswordInvalid
from apps.users.services.auth.mfa import (
    confirm_totp_enrolment,
    count_unused_recovery_codes,
    disable_mfa,
    is_mfa_enabled,
    regenerate_recovery_codes,
    start_totp_enrolment,
    verify_mfa_code,
)
from apps.users.services.auth.mfa_login import complete_mfa_login
from core.api.base import AuthenticatedAPIView, PublicAPIView
from core.api.responses import SuccessResponse
from core.api.schemas import (
    bad_request_schema,
    success_schema,
    too_many_requests_schema,
    unauthorized_schema,
)
from core.api.throttles import MFAThrottle, MFAVerifyThrottle


@extend_schema(
    tags=["MFA"],
    summary="Two-factor status",
    responses={
        200: success_schema(
            description="Status retrieved.",
            response=MFAStatusSerializer,
        ),
        401: unauthorized_schema(),
    },
)
class MFAStatusAPIView(AuthenticatedAPIView):
    """
    Whether a second factor is active on this account.
    """

    serializer_class = MFAStatusSerializer

    def get(self, request: Request, *args, **kwargs) -> Response:
        enabled = is_mfa_enabled(user=request.user)

        return SuccessResponse.ok(
            message="Two-factor status retrieved.",
            data=MFAStatusSerializer(
                {
                    "enabled": enabled,
                    "recovery_codes_remaining": (
                        count_unused_recovery_codes(user=request.user) if enabled else 0
                    ),
                },
            ).data,
        )


@extend_schema(
    tags=["MFA"],
    summary="Begin two-factor enrolment",
    description=(
        "Returns a secret and an otpauth:// URI for an authenticator "
        "app. The factor is not active until confirmed."
    ),
    request=None,
    responses={
        200: success_schema(
            description="Enrolment started.",
            response=MFAEnrolStartResponseSerializer,
        ),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class MFAEnrolAPIView(AuthenticatedAPIView):
    """
    Start TOTP enrolment.
    """

    serializer_class = MFAEnrolStartResponseSerializer
    throttle_classes = (MFAThrottle,)

    def post(self, request: Request, *args, **kwargs) -> Response:
        enrolment = start_totp_enrolment(user=request.user)

        return SuccessResponse.ok(
            message=(
                "Scan the code with your authenticator app, then "
                "confirm with a generated code."
            ),
            data=MFAEnrolStartResponseSerializer(
                {
                    "secret": enrolment.secret,
                    "provisioning_uri": enrolment.provisioning_uri,
                },
            ).data,
        )


@extend_schema(
    tags=["MFA"],
    summary="Confirm two-factor enrolment",
    description=(
        "Activates the pending device and returns recovery codes. The "
        "codes are shown once and cannot be retrieved again."
    ),
    request=MFACodeSerializer,
    responses={
        200: success_schema(
            description="Two-factor authentication enabled.",
            response=RecoveryCodesResponseSerializer,
        ),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class MFAConfirmAPIView(AuthenticatedAPIView):
    """
    Activate a pending TOTP device.
    """

    serializer_class = MFACodeSerializer
    throttle_classes = (MFAThrottle,)

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        codes = confirm_totp_enrolment(
            user=request.user,
            code=serializer.validated_data["code"],
            request=request,
        )

        return SuccessResponse.ok(
            message=(
                "Two-factor authentication enabled. Store these "
                "recovery codes now - they will not be shown again."
            ),
            data=RecoveryCodesResponseSerializer(
                {"codes": codes.codes},
            ).data,
        )


@extend_schema(
    tags=["MFA"],
    summary="Complete sign-in with a second factor",
    description=(
        "Exchanges the ticket returned by a login that answered "
        "`mfa_required` for a token pair."
    ),
    request=MFAVerifySerializer,
    responses={
        200: success_schema(
            description="Sign-in complete.",
            response=LoginResponseSerializer,
        ),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class MFAVerifyAPIView(PublicAPIView):
    """
    Finish a login that stopped at the second factor.
    """

    serializer_class = MFAVerifySerializer
    throttle_classes = (MFAVerifyThrottle,)

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = complete_mfa_login(
            request=request,
            ticket=serializer.validated_data["mfa_ticket"],
            code=serializer.validated_data["code"],
        )

        return SuccessResponse.ok(
            message="Login successful.",
            data=LoginResponseSerializer(result).data,
        )


@extend_schema(
    tags=["MFA"],
    summary="Disable two-factor authentication",
    request=MFADisableSerializer,
    responses={
        200: success_schema(description="Two-factor disabled."),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class MFADisableAPIView(AuthenticatedAPIView):
    """
    Remove the second factor.
    """

    serializer_class = MFADisableSerializer
    throttle_classes = (MFAThrottle,)

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Both proofs are required. A live session alone must not be
        # enough to strip the factor it is supposed to be protected by.
        if not request.user.check_password(
            serializer.validated_data["password"],
        ):
            raise CurrentPasswordInvalid()

        if not verify_mfa_code(
            user=request.user,
            code=serializer.validated_data["code"],
        ):
            from apps.users.exceptions.authentication import InvalidOTP

            raise InvalidOTP()

        disable_mfa(user=request.user, request=request)

        return SuccessResponse.ok(
            message="Two-factor authentication disabled.",
        )


@extend_schema(
    tags=["MFA"],
    summary="Regenerate recovery codes",
    description=(
        "Replaces every existing recovery code. Previous codes stop "
        "working immediately."
    ),
    request=MFACodeSerializer,
    responses={
        200: success_schema(
            description="Recovery codes regenerated.",
            response=RecoveryCodesResponseSerializer,
        ),
        400: bad_request_schema(),
        401: unauthorized_schema(),
        429: too_many_requests_schema(),
    },
)
class MFARecoveryCodesAPIView(AuthenticatedAPIView):
    """
    Issue a fresh set of recovery codes.
    """

    serializer_class = MFACodeSerializer
    throttle_classes = (MFAThrottle,)

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not verify_mfa_code(
            user=request.user,
            code=serializer.validated_data["code"],
        ):
            from apps.users.exceptions.authentication import InvalidOTP

            raise InvalidOTP()

        codes = regenerate_recovery_codes(user=request.user)

        return SuccessResponse.ok(
            message=("Recovery codes regenerated. Previous codes no longer work."),
            data=RecoveryCodesResponseSerializer(
                {"codes": codes.codes},
            ).data,
        )
