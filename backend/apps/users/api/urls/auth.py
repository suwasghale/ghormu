"""
Authentication API endpoints.
"""

from __future__ import annotations

from django.urls import include, path

from apps.users.api.views.auth.change_email import (
    ConfirmEmailChangeAPIView,
    RequestEmailChangeAPIView,
)
from apps.users.api.views.auth.change_password import (
    ChangePasswordAPIView,
)
from apps.users.api.views.auth.delete_account import (
    DeleteAccountAPIView,
)
from apps.users.api.views.auth.email_verification import (
    EmailVerificationAPIView,
)
from apps.users.api.views.auth.forgot_password import (
    ForgotPasswordAPIView,
)
from apps.users.api.views.auth.login import (
    LoginAPIView,
)
from apps.users.api.views.auth.logout import (
    LogoutAPIView,
)
from apps.users.api.views.auth.logout_all import (
    LogoutAllAPIView,
)
from apps.users.api.views.auth.me import (
    MeAPIView,
)
from apps.users.api.views.auth.registration import (
    RegistrationAPIView,
)
from apps.users.api.views.auth.resend_verification import (
    ResendVerificationAPIView,
)
from apps.users.api.views.auth.reset_password import (
    ResetPasswordAPIView,
)
from apps.users.api.views.auth.token_refresh import (
    TokenRefreshAPIView,
)
from apps.users.api.views.mfa import (
    MFAConfirmAPIView,
    MFADisableAPIView,
    MFAEnrolAPIView,
    MFARecoveryCodesAPIView,
    MFAStatusAPIView,
    MFAVerifyAPIView,
)
from apps.users.api.views.social import (
    SocialAuthorizeAPIView,
    SocialCallbackAPIView,
    SocialProviderListAPIView,
)

app_name = "auth"

urlpatterns = [
    # -------------------------------------------------------------------------
    # Registration
    # -------------------------------------------------------------------------
    path(
        "register/",
        RegistrationAPIView.as_view(),
        name="register",
    ),
    path(
        "email/verify/",
        EmailVerificationAPIView.as_view(),
        name="email-verify",
    ),
    # -------------------------------------------------------------------------
    # Authentication
    # -------------------------------------------------------------------------
    path(
        "login/",
        LoginAPIView.as_view(),
        name="login",
    ),
    path(
        "refresh/",
        TokenRefreshAPIView.as_view(),
        name="token-refresh",
    ),
    path(
        "logout/",
        LogoutAPIView.as_view(),
        name="logout",
    ),
    path(
        "logout/all/",
        LogoutAllAPIView.as_view(),
        name="logout-all",
    ),
    # -------------------------------------------------------------------------
    # Password
    # -------------------------------------------------------------------------
    path(
        "password/change/",
        ChangePasswordAPIView.as_view(),
        name="password-change",
    ),
    path(
        "password/forgot/",
        ForgotPasswordAPIView.as_view(),
        name="password-forgot",
    ),
    path(
        "password/reset/",
        ResetPasswordAPIView.as_view(),
        name="password-reset",
    ),
    # -------------------------------------------------------------------------
    # Email
    # -------------------------------------------------------------------------
    path(
        "email/change/request/",
        RequestEmailChangeAPIView.as_view(),
        name="email-change-request",
    ),
    path(
        "email/change/confirm/",
        ConfirmEmailChangeAPIView.as_view(),
        name="email-change-confirm",
    ),
    path(
        "email/resend/",
        ResendVerificationAPIView.as_view(),
        name="email-resend",
    ),
    # -------------------------------------------------------------------------
    # Account
    # -------------------------------------------------------------------------
    path(
        "account/delete/",
        DeleteAccountAPIView.as_view(),
        name="account-delete",
    ),
    path(
        "me/",
        MeAPIView.as_view(),
        name="me",
    ),
    # -------------------------------------------------------------------------
    # Social sign-in
    # -------------------------------------------------------------------------
    path(
        "social/",
        SocialProviderListAPIView.as_view(),
        name="social-providers",
    ),
    path(
        "social/<str:provider>/authorize/",
        SocialAuthorizeAPIView.as_view(),
        name="social-authorize",
    ),
    path(
        "social/<str:provider>/callback/",
        SocialCallbackAPIView.as_view(),
        name="social-callback",
    ),
    # -------------------------------------------------------------------------
    # Multi-factor authentication
    # -------------------------------------------------------------------------
    path(
        "mfa/",
        MFAStatusAPIView.as_view(),
        name="mfa-status",
    ),
    path(
        "mfa/enrol/",
        MFAEnrolAPIView.as_view(),
        name="mfa-enrol",
    ),
    path(
        "mfa/confirm/",
        MFAConfirmAPIView.as_view(),
        name="mfa-confirm",
    ),
    path(
        "mfa/verify/",
        MFAVerifyAPIView.as_view(),
        name="mfa-verify",
    ),
    path(
        "mfa/disable/",
        MFADisableAPIView.as_view(),
        name="mfa-disable",
    ),
    path(
        "mfa/recovery-codes/",
        MFARecoveryCodesAPIView.as_view(),
        name="mfa-recovery-codes",
    ),
    # -------------------------------------------------------------------------
    # Security
    # -------------------------------------------------------------------------
    path(
        "security/",
        include("apps.users.api.urls.security"),
    ),
]
