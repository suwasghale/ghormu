"""Content language: Nepali by default, English on request, nothing else."""

from types import SimpleNamespace

import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from core.i18n import DEFAULT_LANGUAGE, localized, normalise_language, resolve_language


def _request(path="/", **headers):
    return Request(APIRequestFactory().get(path, **headers))


def test_nepali_is_the_default():
    assert DEFAULT_LANGUAGE == "ne"
    assert resolve_language(None) == "ne"
    assert resolve_language(_request()) == "ne"


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("ne", "ne"),
        ("NE", "ne"),
        ("ne-NP", "ne"),
        ("en", "en"),
        ("en_GB", "en"),
        ("fr", "ne"),
        ("", "ne"),
        (None, "ne"),
    ],
)
def test_normalise_language(value, expected):
    assert normalise_language(value) == expected


def test_query_parameter_wins_over_the_header():
    request = _request("/?lang=en", HTTP_ACCEPT_LANGUAGE="ne-NP,ne;q=0.9")
    assert resolve_language(request) == "en"


def test_header_is_used_without_a_query_parameter():
    assert resolve_language(_request(HTTP_ACCEPT_LANGUAGE="en-US,en;q=0.9")) == "en"


def test_localized_falls_back_to_the_other_language():
    row = SimpleNamespace(title_ne="घोर्मु", title_en="")
    assert localized(row, "title", language="en") == "घोर्मु"
    assert localized(row, "title", language="ne") == "घोर्मु"

    row = SimpleNamespace(title_ne="", title_en="Ghormu")
    assert localized(row, "title", language="ne") == "Ghormu"
