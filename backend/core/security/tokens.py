"""
Utilities for generating and hashing secure tokens.

These helpers are intentionally stateless and reusable across the project.
"""

from __future__ import annotations

import hashlib
import secrets
from urllib.parse import urlencode

DEFAULT_TOKEN_BYTES = 32


def generate_secure_token(
    *,
    nbytes: int = DEFAULT_TOKEN_BYTES,
) -> str:
    """
    Generate a cryptographically secure URL-safe token.

    Args:
        nbytes:
            Number of random bytes before URL-safe encoding.

    Returns:
        A URL-safe random token.
    """
    return secrets.token_urlsafe(nbytes)


def hash_token(
    raw_token: str,
) -> str:
    """
    Return the SHA-256 hash of a token.

    The raw token should never be stored in the database.
    Only its hash should be persisted.

    Args:
        token:
            Raw token.

    Returns:
        Hexadecimal SHA-256 digest.
    """
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_hashed_token(
    *,
    nbytes: int = DEFAULT_TOKEN_BYTES,
) -> tuple[str, str]:
    """
    Generate a secure token and its hash.

    Returns:
        Tuple of:

        (
            raw_token,
            token_hash,
        )
    """
    raw_token = generate_secure_token(
        nbytes=nbytes,
    )

    return (
        raw_token,
        hash_token(raw_token),
    )


def verify_token(
    *,
    raw_token: str,
    token_hash: str,
) -> bool:
    """
    Verify whether a raw token matches a stored hash.

    Args:
        raw_token:
            Raw token provided by the client.

        token_hash:
            Stored SHA-256 hash.

    Returns:
        True if the hashes match.
    """
    return secrets.compare_digest(hash_token(raw_token), token_hash)


def build_frontend_url(
    *,
    base_url: str,
    token: str,
    **query_params,
) -> str:
    """
    Build a frontend URL containing the raw token.

    Example:
        build_frontend_url(
            base_url="https://app.example.com/reset-password",
            token="abc123",
            email="user@example.com",
        )

    Returns:
        https://app.example.com/reset-password?token=abc123&email=user@example.com
    """
    params = {
        "token": token,
        **query_params,
    }

    return f"{base_url}?{urlencode(params)}"
