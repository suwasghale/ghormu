"""Identity, accounts, administration, and the public website's content."""

from django.urls import include, path

from apps.contact.api import urls as contact_urls
from apps.public_content.api import urls as content_urls
from core.api.admin_media import AdminMediaUploadAPIView

urlpatterns = [
    path("admin/dashboard/", include("apps.dashboard.api.urls")),
    path("", include("apps.users.api.urls")),
    path("me/", include("apps.profiles.api.urls")),
    path("admin/users/", include("apps.users.api.admin.urls")),
    path("admin/media/", AdminMediaUploadAPIView.as_view(), name="admin-media-upload"),
    path("content/", include((content_urls.public_urlpatterns, "content"))),
    path("admin/", include((content_urls.admin_urlpatterns, "content-admin"))),
    path("contact/", include((contact_urls.public_urlpatterns, "contact"))),
    path("admin/messages/", include((contact_urls.admin_urlpatterns, "contact-admin"))),
]
