"""
Routes for the public website's content: public reads and staff admin.
"""

from django.urls import path

from apps.public_content.api import admin_views, views

public_urlpatterns = [
    path("posts/", views.PostListAPIView.as_view(), name="post-list"),
    path("posts/<slug:slug>/", views.PostDetailAPIView.as_view(), name="post-detail"),
    path("events/", views.EventListAPIView.as_view(), name="event-list"),
    path("projects/", views.ProjectListAPIView.as_view(), name="project-list"),
    path("archive/", views.ArchiveListAPIView.as_view(), name="archive-list"),
    path(
        "archive/<slug:slug>/",
        views.ArchiveDetailAPIView.as_view(),
        name="archive-detail",
    ),
]

admin_urlpatterns = [
    path("posts/", admin_views.PostAdminListAPIView.as_view(), name="admin-post-list"),
    path(
        "posts/<uuid:id>/",
        admin_views.PostAdminDetailAPIView.as_view(),
        name="admin-post-detail",
    ),
    path(
        "events/", admin_views.EventAdminListAPIView.as_view(), name="admin-event-list"
    ),
    path(
        "events/<uuid:id>/",
        admin_views.EventAdminDetailAPIView.as_view(),
        name="admin-event-detail",
    ),
    path(
        "projects/",
        admin_views.ProjectAdminListAPIView.as_view(),
        name="admin-project-list",
    ),
    path(
        "projects/<uuid:id>/",
        admin_views.ProjectAdminDetailAPIView.as_view(),
        name="admin-project-detail",
    ),
    path(
        "archive/",
        admin_views.ArchiveAdminListAPIView.as_view(),
        name="admin-archive-list",
    ),
    path(
        "archive/<uuid:id>/",
        admin_views.ArchiveAdminDetailAPIView.as_view(),
        name="admin-archive-detail",
    ),
]
