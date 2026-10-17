"""Account totals for the reusable administration dashboard."""

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema

from core.api.admin import AdminAPIView
from core.api.responses import SuccessResponse

User = get_user_model()


class AdminDashboardAPIView(AdminAPIView):
    @extend_schema(summary="Admin dashboard counters", responses={200: dict})
    def get(self, request, *args, **kwargs):
        return SuccessResponse.ok(data={"users": self._user_counts()})

    @staticmethod
    def _user_counts() -> dict[str, int]:
        return User._default_manager.aggregate(
            total=Count("id"),
            active=Count("id", filter=Q(is_active=True)),
            staff=Count("id", filter=Q(is_staff=True)),
            unverified=Count("id", filter=Q(is_verified=False)),
        )
