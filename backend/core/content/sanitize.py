"""
Rich-text sanitisation.

Editors paste HTML from a WYSIWYG. That HTML is stored, served by the
API and rendered by the frontend with ``dangerouslySetInnerHTML``, so an
unsanitised ``<script>`` in a project description is stored XSS against
every visitor.

The frontend already sanitises on render (``RichContent``). This is the
other half: sanitise on write, so the database never holds markup we
would not be willing to serve. Two layers, because either one alone
fails the moment someone adds a second consumer — an email, a PDF
export, a sitemap description.

Allowed markup mirrors what the editor can produce and what
``RichContent`` is prepared to style.
"""

from __future__ import annotations

import html

import nh3

#: Tags an editor may use. Deliberately no <script>, <style>, <iframe>,
#: <object>, <embed>, <form> or <input>.
ALLOWED_TAGS: set[str] = {
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "mark",
    "a",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "img",
    "figure",
    "figcaption",
    "span",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "hr",
}

ALLOWED_ATTRIBUTES: dict[str, set[str]] = {
    # No "rel" here: nh3 owns that attribute because link_rel is set
    # below, and declaring both is a configuration error it rejects.
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height", "loading"},
    "span": {"style", "class"},
    "p": {"style", "class"},
    "th": {"colspan", "rowspan", "scope"},
    "td": {"colspan", "rowspan"},
    "figure": {"class"},
    "blockquote": {"cite"},
}

#: Anything not in here becomes an inert relative link. `javascript:` is
#: the obvious one; `data:` matters too, since a data: URL in an <a> can
#: carry a whole HTML document.
ALLOWED_SCHEMES: set[str] = {"http", "https", "mailto", "tel"}


def sanitize_html(value: str | None) -> str:
    """
    Return ``value`` with everything unsafe removed.

    Empty input returns an empty string rather than ``None`` so callers
    can store the result in a ``TextField(blank=True)`` without a branch.
    """

    if not value:
        return ""

    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_SCHEMES,
        # Every outbound link opened in a new tab gets rel="noopener",
        # so a linked page cannot reach back through window.opener.
        link_rel="noopener noreferrer",
    )


def strip_html(value: str | None, *, limit: int | None = None) -> str:
    """
    Plain text from HTML, for meta descriptions and stored form input.

    Two steps, and the second is not optional. ``nh3.clean`` with no
    allowed tags removes the markup but leaves the entities escaped, so
    "Don & soutien" comes back as "Don &amp; soutien" — which is not
    plain text, and is exactly what a volunteer then reads in the admin
    and in a notification email.

    Unescaping afterwards is safe because the result is plain text by
    contract: every consumer either counts words or hands it to a
    template that escapes on output. Anything that inserts this into
    markup unescaped would be a bug at that call site, not here.
    """

    if not value:
        return ""

    text = " ".join(html.unescape(nh3.clean(value, tags=set())).split())

    if limit is not None and len(text) > limit:
        return text[: limit - 1].rstrip() + "…"

    return text


def plain_text(value: str | None) -> str:
    """
    Plain text that keeps its paragraphs, for multi-line form fields.

    ``strip_html`` flattens everything onto one line, which suits a meta
    description but turns a three-paragraph story into one block. This
    removes markup the same way, then tidies each line and keeps single
    blank lines between paragraphs.
    """

    if not value:
        return ""

    text = html.unescape(nh3.clean(value.replace("\r\n", "\n"), tags=set()))
    lines = [" ".join(line.split()) for line in text.split("\n")]

    paragraphs: list[str] = []
    current: list[str] = []

    for line in lines:
        if line:
            current.append(line)
        elif current:
            paragraphs.append("\n".join(current))
            current = []

    if current:
        paragraphs.append("\n".join(current))

    return "\n\n".join(paragraphs)
