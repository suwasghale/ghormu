"""
Pagination classes.

``MAX_PAGE_SIZE`` is not a REST_FRAMEWORK setting - DRF only reads
``max_page_size`` off the pagination class. Setting it in
REST_FRAMEWORK, as this project previously did, has no effect and leaves
``page_size`` unbounded if the client is allowed to supply it.
"""

from __future__ import annotations

from django.conf import settings
from django.db.models import QuerySet
from rest_framework.pagination import (
    CursorPagination,
    PageNumberPagination,
)

from core.api.responses import SuccessResponse


def stable_order(queryset):
    """
    Give a queryset a total order, so LIMIT/OFFSET can be sliced safely.

    SQL guarantees nothing about the relative order of rows that tie on
    every ORDER BY column, and Postgres genuinely varies it: the planner
    can pick a different strategy at different offsets, so two pages of
    the same list are two different sorts. Rows then appear on both
    pages, and the rows they displaced appear on neither.

    That is not hypothetical here. ``Project.Meta.ordering`` is
    ``("-display_order", "-year", "-published_at")``; every seeded row
    shares a ``display_order`` of 0 and one ``published_at``, so the key
    collapses to ``year`` and seven projects tie on 2026. Walking
    ``/content/projects/`` two rows at a time returned 17 rows made up
    of 14 distinct projects: two duplicated, three unreachable at any
    page number.

    Appending the primary key fixes it for every list at once. The pk is
    unique by definition, so it can only ever break a tie — it never
    reorders rows that were already distinguishable, which is why this
    is safe to apply everywhere rather than model by model. A UUID pk
    orders arbitrarily, but arbitrarily and *consistently* is the whole
    requirement.

    Doing it here rather than in 25 ``Meta.ordering`` tuples also means
    the next model added to the API cannot forget.
    """

    if not isinstance(queryset, QuerySet):
        # A plain list, already materialised — nothing to order.
        return queryset

    query = queryset.query

    # `.distinct("field")` requires ORDER BY to start with those fields,
    # and `.values()` may not even select the pk. Both are narrow cases
    # that would break if a column were appended; neither is used by a
    # paginated endpoint here, so they are left exactly as they are.
    if query.distinct_fields or query.values_select:
        return queryset

    # Django raises "Cannot reorder a query once a slice has been taken",
    # so a sliced queryset must be handed back untouched. The collection
    # views build one (`get_base_queryset()[:MAX_ITEMS]`); they do not
    # paginate today, but they share this class hierarchy and one of them
    # gaining a paginator should not turn into a 500.
    #
    # Such a list is bounded rather than paged, so it cannot drop rows
    # between pages — but *which* rows a slice returns is still arbitrary
    # when the ordering ties. The fix for that belongs in the view, by
    # ordering before slicing, not here after the fact.
    if query.is_sliced:
        return queryset

    ordering = query.order_by or queryset.model._meta.ordering or ()

    pk_names = {"pk", queryset.model._meta.pk.name}

    for term in ordering:
        # Ordering may hold plain strings ("-created_at") or expressions
        # (`F("event_date").asc(nulls_last=True)`, used by Announcement).
        name = getattr(getattr(term, "expression", None), "name", None) or str(term)

        if name.lstrip("-") in pk_names:
            # Already totally ordered; appending would be redundant.
            return queryset

    return queryset.order_by(*ordering, "pk")


class StandardPagination(PageNumberPagination):
    """
    Page-number pagination with a client-supplied, bounded page size.
    """

    page_size_query_param = "page_size"

    @property
    def page_size(self) -> int:
        return settings.API_PAGE_SIZE

    @property
    def max_page_size(self) -> int:
        return settings.MAX_API_PAGE_SIZE

    def paginate_queryset(self, queryset, request, view=None):
        # See stable_order: without a unique final sort key, paging can
        # duplicate rows onto two pages and hide others entirely.
        return super().paginate_queryset(stable_order(queryset), request, view)

    def get_paginated_response(self, data):
        """
        Wrap paginated results in the project's response envelope.
        """

        return SuccessResponse.ok(
            message="Results retrieved successfully.",
            data={
                "results": data,
                "pagination": {
                    "count": self.page.paginator.count,
                    "page": self.page.number,
                    "pages": self.page.paginator.num_pages,
                    "page_size": self.get_page_size(self.request),
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
            },
        )


class TimelineCursorPagination(CursorPagination):
    """
    Cursor pagination for large, append-only tables.

    Page-number pagination degrades on big tables because OFFSET forces
    the database to walk every skipped row. Use this for audit logs and
    similar high-volume, time-ordered data.
    """

    ordering = "-created_at"
    page_size_query_param = "page_size"

    @property
    def page_size(self) -> int:
        return settings.API_PAGE_SIZE

    @property
    def max_page_size(self) -> int:
        return settings.MAX_API_PAGE_SIZE
