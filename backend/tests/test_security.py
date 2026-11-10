"""Tests for password hashing, JWT handling, and configuration validation."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import (
    ConfigurationError,
    TokenDecodeError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

TEST_SECRET = (
    "unit-test-secret-key-0123456789abcdefghijklmnopqrstuvwxyz-"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
)
TEST_DATABASE_URL = "mssql+pyodbc://user:pass@localhost:1433/tasks"


def _settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "app_env": "test",
        "database_url": TEST_DATABASE_URL,
        "jwt_secret": TEST_SECRET,
        "jwt_algorithm": "HS256",
        "access_token_expire_minutes": 60,
        "cors_origins": "",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_password_is_hashed_and_differs_from_plaintext() -> None:
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$argon2id$")


def test_correct_password_verifies() -> None:
    password = "SecurePassword123!"
    assert verify_password(password, hash_password(password)) is True


def test_incorrect_password_fails() -> None:
    hashed = hash_password("SecurePassword123!")
    assert verify_password("WrongPassword123!", hashed) is False


def test_invalid_hash_format_is_handled_safely() -> None:
    assert verify_password("whatever", "not-a-valid-hash") is False


def test_access_token_contains_required_claims() -> None:
    settings = _settings()
    token = create_access_token(42, settings=settings)

    payload = decode_access_token(token, settings=settings)

    assert payload["sub"] == "42"
    assert "iat" in payload
    assert "exp" in payload
    assert payload["exp"] > payload["iat"]


def test_expired_access_token_is_rejected() -> None:
    settings = _settings()
    token = create_access_token(
        1,
        settings=settings,
        expires_delta=timedelta(seconds=-30),
    )

    with pytest.raises(TokenDecodeError):
        decode_access_token(token, settings=settings)


def test_token_signed_with_other_secret_is_rejected() -> None:
    token = create_access_token(1, settings=_settings(jwt_secret="a" * 40))

    with pytest.raises(TokenDecodeError):
        decode_access_token(token, settings=_settings())


def test_token_without_iat_claim_is_rejected() -> None:
    settings = _settings()
    now = datetime.now(UTC)
    token = jwt.encode(
        {"sub": "1", "exp": now + timedelta(minutes=5)},
        settings.jwt_secret,
        algorithm="HS256",
    )

    with pytest.raises(TokenDecodeError):
        decode_access_token(token, settings=settings)


def test_token_with_disallowed_algorithm_is_rejected() -> None:
    settings = _settings()
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "sub": "1",
            "iat": now,
            "exp": now + timedelta(minutes=5),
        },
        settings.jwt_secret,
        algorithm="HS512",
    )

    with pytest.raises(TokenDecodeError):
        decode_access_token(token, settings=settings)


def test_non_numeric_subject_is_rejected() -> None:
    settings = _settings()
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "sub": "not-a-number",
            "iat": now,
            "exp": now + timedelta(minutes=5),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )

    with pytest.raises(TokenDecodeError):
        decode_access_token(token, settings=settings)


def test_create_token_without_secret_raises_configuration_error() -> None:
    settings = _settings(jwt_secret="")

    with pytest.raises(ConfigurationError):
        create_access_token(1, settings=settings)


def test_production_requires_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        _settings(app_env="production", jwt_secret="")


def test_production_rejects_short_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        _settings(app_env="production", jwt_secret="too-short")


def test_production_requires_database_url() -> None:
    with pytest.raises(ValidationError):
        _settings(
            app_env="production",
            database_url="",
            jwt_secret="x" * 40,
        )


def test_production_accepts_strong_configuration() -> None:
    settings = _settings(
        app_env="production",
        jwt_secret="y" * 48,
        database_url=TEST_DATABASE_URL,
    )

    assert settings.app_env == "production"


def test_test_environment_uses_dedicated_secret() -> None:
    settings = _settings(app_env="test")

    assert settings.jwt_secret == TEST_SECRET
    assert settings.jwt_algorithm == "HS256"


def test_non_hs256_algorithm_is_rejected() -> None:
    with pytest.raises(ValidationError):
        _settings(jwt_algorithm="RS256")


def test_cors_origins_are_split_and_trimmed() -> None:
    settings = _settings(
        cors_origins="http://localhost:5173, http://127.0.0.1:5173 ,",
    )

    assert settings.cors_origins_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
