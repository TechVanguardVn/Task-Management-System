"""Password hashing and JWT helpers.

Passwords are hashed with Argon2id. Access tokens are signed and verified
with PyJWT using an explicit HS256 allowlist.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import Settings, get_settings

ALLOWED_JWT_ALGORITHMS = frozenset({"HS256"})

_hasher = PasswordHasher(type=Type.ID)

# A valid Argon2id hash of an arbitrary value. It is used to equalise the cost
# of a login attempt for unknown emails, mitigating user enumeration by timing.
DUMMY_PASSWORD_HASH = _hasher.hash("dummy-password-for-timing-mitigation")


class ConfigurationError(RuntimeError):
    """Raised when security configuration is missing or invalid."""


class TokenDecodeError(Exception):
    """Raised when a JWT is malformed, expired, or otherwise invalid."""


def _resolve_settings(settings: Settings | None) -> Settings:
    return settings if settings is not None else get_settings()


def _validate_secret(settings: Settings) -> None:
    if not settings.jwt_secret.strip():
        raise ConfigurationError("JWT_SECRET is not configured")
    if settings.jwt_algorithm not in ALLOWED_JWT_ALGORITHMS:
        raise ConfigurationError(
            f"Unsupported JWT algorithm: {settings.jwt_algorithm}"
        )


def hash_password(password: str) -> str:
    """Return an Argon2id hash for the given plaintext password."""
    return _hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Safely verify a plaintext password against an Argon2 hash.

    Invalid or malformed hashes are treated as a failed verification rather
    than raising, so authentication callers always receive a boolean.
    """
    try:
        return _hasher.verify(hashed_password, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError, TypeError, ValueError):
        return False


def create_access_token(
    subject: str | int,
    settings: Settings | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT with subject, issued-at, and expiration claims."""
    config = _resolve_settings(settings)
    _validate_secret(config)

    issued_at = datetime.now(UTC)
    expires_at = issued_at + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=config.access_token_expire_minutes)
    )

    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": issued_at,
        "exp": expires_at,
    }

    return jwt.encode(payload, config.jwt_secret, algorithm=config.jwt_algorithm)


def decode_access_token(
    token: str,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """Decode and validate a JWT, raising TokenDecodeError on failure."""
    config = _resolve_settings(settings)
    _validate_secret(config)

    try:
        payload = jwt.decode(
            token,
            config.jwt_secret,
            algorithms=[config.jwt_algorithm],
            options={"require": ["sub", "exp", "iat"]},
        )
    except jwt.InvalidTokenError as exc:
        raise TokenDecodeError("Invalid or expired access token") from exc

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdigit():
        raise TokenDecodeError("Access token subject is invalid")

    return payload
