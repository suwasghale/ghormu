"""Passwords must round-trip without changing the Redis destination or database."""

from urllib.parse import unquote, urlsplit

import pytest

from config.settings.components import cache, celery


@pytest.mark.parametrize("component", [cache, celery])
@pytest.mark.parametrize("password", ["", "qa-safe", "qa/@:#?% नेपाल"])
def test_redis_password_round_trip(component, password, monkeypatch):
    monkeypatch.setattr(component, "REDIS_PASSWORD", password)
    monkeypatch.setattr(component, "REDIS_HOST", "qa-redis")
    monkeypatch.setattr(component, "REDIS_PORT", 6379)
    parsed = urlsplit(component.build_redis_url(3))
    assert parsed.hostname == "qa-redis"
    assert parsed.port == 6379
    assert parsed.path == "/3"
    assert not parsed.query
    assert not parsed.fragment
    assert unquote(parsed.password or "") == password
