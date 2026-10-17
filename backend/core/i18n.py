"""
Language resolution and paired-field access.

Translatable content is stored as two columns — ``title_fr`` and
``title_en`` — rather than in a translation table. With exactly two fixed
languages that keeps reads to a single row, keeps the admin to a single
form, and keeps "the French title" a plain attribute.

The cost is that every reader has to agree on how a language is chosen
and what happens when one side is empty. That agreement lives here.
"""

from __future__ import annotations

from typing import Any

from core.choices import LanguageChoices

#: Used when the request expresses no usable preference. French is the
#: primary language of the site; English is opt-in.
DEFAULT_LANGUAGE = LanguageChoices.FR

#: Query parameter that wins over any header.
LANGUAGE_QUERY_PARAM = "lang"


def normalise_language(value: str | None) -> str:
    """
    Map anything a client sends to one of the supported codes.

    Accepts ``fr``, ``FR``, ``fr-FR``, ``fr_CA``; rejects the rest by
    falling back rather than erroring. A bad language is not worth a 400:
    the visitor still wants the page.
    """

    if not value:
        return DEFAULT_LANGUAGE

    base = value.strip().lower().replace("_", "-").split("-")[0]

    if base in LanguageChoices.values:
        return base

    return DEFAULT_LANGUAGE


def resolve_language(request) -> str:
    """
    Decide which language a request is asking for.

    Order of precedence:

    1. ``?lang=`` — explicit, and what the frontend sends, because its
       own routing already knows the locale from the URL segment.
    2. ``Accept-Language`` — for anything hitting the API directly.
    3. French.

    Django's ``LocaleMiddleware`` is not consulted: it resolves the
    language for *interface* translation (admin, emails), which is a
    different question from which column of content to return.
    """

    if request is None:
        return DEFAULT_LANGUAGE

    has_params = hasattr(request, "query_params")
    explicit = request.query_params.get(LANGUAGE_QUERY_PARAM) if has_params else None

    if explicit:
        return normalise_language(explicit)

    has_headers = hasattr(request, "headers")
    header = request.headers.get("Accept-Language") if has_headers else None

    if header:
        # "fr-FR,fr;q=0.9,en;q=0.8" — the first entry is enough; the
        # q-value ordering only matters when we support more languages
        # than the client's top choice.
        return normalise_language(header.split(",")[0])

    return DEFAULT_LANGUAGE


def localized(instance: Any, field: str, *, language: str) -> Any:
    """
    Read ``field`` in ``language``, falling back to the other language.

    Falling back matters: an editor who has written the French half of a
    post and published it should not serve an English visitor a blank
    title. Showing the French text is worse than English and better than
    nothing, and it is visible enough that someone fixes it.
    """

    primary = getattr(instance, f"{field}_{language}", None)

    if primary:
        return primary

    other = LanguageChoices.EN if language == LanguageChoices.FR else LanguageChoices.FR

    return getattr(instance, f"{field}_{other}", None) or ""
