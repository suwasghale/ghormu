"""Exercise the local Compose stack through its BFF and captured email.

Creates and deactivates a disposable smoke account. Never targets a remote host.
"""
import argparse
import http.cookiejar
import json
import re
import secrets
import time
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=3010)
    parser.add_argument("--mail-port", type=int, default=8030)
    args = parser.parse_args()
    origin = f"http://localhost:{args.port}"
    mail = f"http://localhost:{args.mail_port}"
    jar = http.cookiejar.CookieJar()
    client = build_opener(HTTPCookieProcessor(jar))
    email = f"smoke-{secrets.token_hex(6)}@example.com"
    password = secrets.token_urlsafe(24) + "A1!"

    def call(path, method="GET", data=None, status=200, request_origin=origin):
        headers = {"Origin": request_origin, "Content-Type": "application/json"}
        request = Request(origin + path, method=method, headers=headers,
                          data=json.dumps(data).encode() if data is not None else None)
        try:
            response = client.open(request, timeout=90)
        except HTTPError as error:
            response = error
        raw = response.read()
        assert response.status == status, f"{method} {path}: {response.status}: {raw[:500]!r}"
        return json.loads(raw) if raw else None

    def token(recipient, route):
        deadline = time.monotonic() + 45
        while time.monotonic() < deadline:
            messages = json.load(urlopen(mail + "/api/v1/messages", timeout=10))
            for message in messages["messages"]:
                if not any(item["Address"] == recipient for item in message["To"]):
                    continue
                detail = json.load(urlopen(mail + "/api/v1/message/" + message["ID"], timeout=10))
                for link in re.findall(r"https?://[^\s<>\"]+", detail["Text"]):
                    parsed = urlsplit(link)
                    if parsed.path.rstrip("/") == route:
                        return parse_qs(parsed.query)["token"][0]
            time.sleep(1)
        raise AssertionError(f"No {route} message arrived through Celery/Mailpit")

    call("/api/auth/login", "POST", {}, status=403, request_origin="https://attacker.invalid")
    call("/api/proxy/auth/register", "POST", {
        "email": email, "password": password, "password_confirm": password,
        "first_name": "Smoke", "last_name": "Test",
    }, status=201)
    call("/api/proxy/auth/email/verify", "POST", {"token": token(email, "/verify-email")})
    print("PASS registration, queued email and verification", flush=True)
    response = call("/api/auth/login", "POST", {"email": email, "password": password})
    assert "tokens" not in response["data"]
    assert any(cookie.name.endswith("_access") for cookie in jar)
    assert any(cookie.name.endswith("_refresh") for cookie in jar)
    assert all(cookie.has_nonstandard_attr("HttpOnly") for cookie in jar)
    assert call("/api/proxy/auth/me")["data"]["email"] == email
    call("/api/proxy/me/profile", "PATCH", {"first_name": "Updated", "biography": "Smoke verification"})
    assert call("/api/proxy/me/profile")["data"]["biography"] == "Smoke verification"
    assert call("/api/proxy/auth/me")["data"]["first_name"] == "Updated"
    call("/api/proxy/auth/security/sessions")
    call("/api/proxy/admin/dashboard", status=403)
    call("/api/auth/refresh", "POST")
    call("/api/auth/logout", "POST")
    call("/api/proxy/auth/me", status=401)
    print("PASS cookies, profile, sessions, staff permissions, refresh and logout", flush=True)
    call("/api/proxy/auth/password/forgot", "POST", {"email": email})
    new_password = secrets.token_urlsafe(24) + "A1!"
    call("/api/proxy/auth/password/reset", "POST", {
        "token": token(email, "/reset-password"),
        "password": new_password, "password_confirm": new_password,
    })
    call("/api/auth/login", "POST", {"email": email, "password": new_password})
    call("/api/proxy/auth/account/delete", "DELETE", {"password": new_password})
    call("/api/proxy/auth/me", status=401)
    call("/api/auth/logout", "POST")
    print("PASS password recovery and account deactivation", flush=True)


if __name__ == "__main__":
    main()
