"""
Address API URLs.
"""

from django.urls import path

from apps.profiles.api.views.address.detail import (
    AddressDetailAPIView,
)
from apps.profiles.api.views.address.list_create import (
    AddressListCreateAPIView,
)
from apps.profiles.api.views.address.set_default import (
    AddressSetDefaultAPIView,
)

urlpatterns = [
    path(
        "",
        AddressListCreateAPIView.as_view(),
        name="address-list-create",
    ),
    path(
        "<uuid:address_id>/",
        AddressDetailAPIView.as_view(),
        name="address-detail",
    ),
    path(
        "<uuid:address_id>/default/",
        AddressSetDefaultAPIView.as_view(),
        name="address-set-default",
    ),
]
