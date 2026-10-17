"""
Base views for the authenticated admin API.

Everything under ``/api/v1/admin/`` is staff-only, writable, and
uncacheable — the mirror image of ``core.api.public``. Centralising it
here means a new admin resource is a serializer plus two lines of
configuration, not another chance to forget the permission class or the
revalidation hook.

Three deliberate differences from the public API:

* **Both languages are exposed.** The public serializers collapse
  ``title_fr``/``title_en`` into one ``title`` for the requested
  language. An editor needs to see and set both, so admin serializers
  work on the raw model fields.

* **Drafts are visible.** The public selectors filter to published rows;
  an admin list that hid drafts would hide exactly the rows an editor
  came to work on.

* **Writes revalidate.** A save through this API must invalidate the
  frontend's cache the same way a save through the Django admin does,
  or the two admins disagree about what the site shows.
"""

from __future__ import annotations

from django.db.models import Q, QuerySet
from drf_spectacular.openapi import AutoSchema
from rest_framework.permissions import IsAuthenticated

from core.api.base import BaseAPIView
from core.api.permissions import IsStaff
from core.api.responses import SuccessResponse
from core.content import revalidate_paths
from core.exceptions import NotFound


class AdminAutoSchema(AutoSchema):
    """
    Teaches drf-spectacular that ``GET`` on a list view returns a list.

    These are plain ``APIView`` subclasses rather than ViewSets, so
    spectacular has no ``action`` to read and assumes every ``GET`` is a
    retrieve. That produced a single-object response schema for the list
    endpoints and, because list and detail then generate the same
    operation id, a pile of "operationId has collisions" warnings with
    numeral suffixes papered over them.
    """

    def _is_list_view(self, serializer=None):
        if self.method == "GET" and isinstance(self.view, AdminListCreateAPIView):
            return True

        return super()._is_list_view(serializer)


class AdminAPIView(BaseAPIView):
    """
    Staff-only base view.

    ``IsAuthenticated`` is listed alongside ``IsStaff`` even though
    ``IsStaff`` checks authentication itself: DRF picks the 401-vs-403
    distinction from the first failing permission, and without it an
    anonymous request gets 403 ("you lack access") where 401 ("log in")
    is the truthful answer.
    """

    permission_classes = (
        IsAuthenticated,
        IsStaff,
    )

    schema = AdminAutoSchema()

    # ------------------------------------------------------------------
    # Revalidation
    # ------------------------------------------------------------------

    #: Cache tag the frontend groups this resource under. Set per view.
    revalidate_tag: str = ""

    #: Locale-less paths that should also be rebuilt. The frontend
    #: expands each into its /fr and /en variants. Named to match the
    #: Django admin mixin in apps/content/admin/collections.py, and so
    #: it does not shadow the imported `revalidate_paths` function.
    revalidate_extra_paths: tuple[str, ...] = ()

    def revalidate(self, *extra_paths: str) -> None:
        """
        Queue a frontend rebuild for whatever this view just changed.

        Safe to call on every write: it is a no-op when neither a tag
        nor a path is configured.
        """

        tags = [self.revalidate_tag] if self.revalidate_tag else []

        revalidate_paths(
            *self.revalidate_extra_paths,
            *extra_paths,
            tags=tags,
        )

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        # An admin list is per-editor and changes constantly. Caching it
        # anywhere — browser, proxy, CDN — shows one editor another's
        # stale view, or a draft to someone who just lost access.
        response["Cache-Control"] = "no-store"

        return response


class AdminResourceMixin:
    """
    Shared queryset shaping for the list and detail views.

    Subclasses declare the model and serializer; everything below is
    configuration rather than code.
    """

    #: The model this resource manages.
    model = None

    #: Fields matched by ``?search=``. Use ``__icontains`` semantics —
    #: the lookup is added here, so declare bare field names.
    search_fields: tuple[str, ...] = ()

    #: Fields accepted by ``?ordering=``. A leading ``-`` is allowed.
    #: Anything not listed is ignored rather than rejected, so a stale
    #: bookmark degrades to the default order instead of erroring.
    ordering_fields: tuple[str, ...] = ()

    #: Default ordering when the client asks for none.
    default_ordering: tuple[str, ...] = ("-created_at",)

    #: Fields accepted as exact-match filters, e.g. ``?status=draft``.
    filter_fields: tuple[str, ...] = ()

    #: Relations to pull in one query. Set on list-heavy resources.
    select_related: tuple[str, ...] = ()
    prefetch_related: tuple[str, ...] = ()

    def get_base_queryset(self) -> QuerySet:
        queryset = self.model._default_manager.all()

        if self.select_related:
            queryset = queryset.select_related(*self.select_related)

        if self.prefetch_related:
            queryset = queryset.prefetch_related(*self.prefetch_related)

        return queryset

    def get_queryset(self) -> QuerySet:
        queryset = self.get_base_queryset()

        # drf-spectacular introspects views with no request attached. The
        # filter and search helpers all read query params, so without this
        # they raise, spectacular swallows the error, and the endpoint is
        # silently dropped from the schema — which is how the detail views
        # went missing from the OpenAPI document while working fine.
        if getattr(self, "request", None) is None:
            return queryset.order_by(*self.default_ordering)

        queryset = self._apply_filters(queryset)
        queryset = self._apply_search(queryset)

        return queryset.order_by(*self._resolved_ordering())

    # ------------------------------------------------------------------
    # Query parsing
    # ------------------------------------------------------------------

    def _apply_filters(self, queryset: QuerySet) -> QuerySet:
        for field in self.filter_fields:
            value = self.request.query_params.get(field)

            if value in (None, ""):
                continue

            # Booleans arrive as strings over the wire.
            if value in ("true", "false"):
                value = value == "true"

            queryset = queryset.filter(**{field: value})

        return queryset

    def _apply_search(self, queryset: QuerySet) -> QuerySet:
        term = (self.request.query_params.get("search") or "").strip()

        if not term or not self.search_fields:
            return queryset

        condition = Q()

        for field in self.search_fields:
            condition |= Q(**{f"{field}__icontains": term})

        return queryset.filter(condition)

    def _resolved_ordering(self) -> tuple[str, ...]:
        requested = self.request.query_params.get("ordering")

        if not requested:
            return self.default_ordering

        field = requested.removeprefix("-")

        if field not in self.ordering_fields:
            return self.default_ordering

        return (requested,)


class AdminListCreateAPIView(AdminResourceMixin, AdminAPIView):
    """
    ``GET`` a paginated list, ``POST`` a new row.
    """

    def get(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True)

        return self.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instance = serializer.save()

        self.revalidate(*self._instance_paths(instance))

        return SuccessResponse.created(
            message=f"{self.model._meta.verbose_name.capitalize()} created.",
            data=serializer.data,
        )

    def _instance_paths(self, instance) -> tuple[str, ...]:
        """
        The row's own page, when it has one.
        """

        path = getattr(instance, "detail_path", None)

        return (path,) if path else ()


class AdminDetailAPIView(AdminResourceMixin, AdminAPIView):
    """
    ``GET`` / ``PATCH`` / ``DELETE`` one row by primary key.

    ``PATCH`` only — no ``PUT``. A full replace from an admin form is a
    lost-update waiting to happen: two editors on the same record and
    the second one silently reverts every field the first changed but
    the form did not send.
    """

    #: Name of the URL keyword argument, not of a model field —
    #: `lookup_field` would be the wrong name for it.
    lookup_url_kwarg = "id"

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg)

        instance = self.get_base_queryset().filter(pk=lookup).first()

        if instance is None:
            raise NotFound(
                f"{self.model._meta.verbose_name.capitalize()} not found.",
            )

        return instance

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())

        return SuccessResponse.ok(data=serializer.data)

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        # Captured before the save: renaming a slug must rebuild the old
        # URL too, or the previous page keeps serving from cache.
        previous_path = getattr(instance, "detail_path", None)

        instance = serializer.save()

        current_path = getattr(instance, "detail_path", None)

        self.revalidate(*{path for path in (previous_path, current_path) if path})

        return SuccessResponse.ok(
            message=f"{self.model._meta.verbose_name.capitalize()} updated.",
            data=serializer.data,
        )

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()

        path = getattr(instance, "detail_path", None)

        instance.delete()

        self.revalidate(*(path,) if path else ())

        return SuccessResponse.ok(
            message=f"{self.model._meta.verbose_name.capitalize()} deleted.",
            data=None,
        )
