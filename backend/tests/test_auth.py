"""End-to-end authentication tests using the FastAPI TestClient."""

from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.user import User

REGISTER_PAYLOAD = {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "full_name": "Nguyen Van A",
}


def _register(client: TestClient, **overrides: object) -> dict:
    payload = {**REGISTER_PAYLOAD, **overrides}
    return client.post("/api/v1/auth/register", json=payload)


def _login(client: TestClient, email: str, password: str) -> dict:
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


def test_register_returns_201_and_public_user(client: TestClient) -> None:
    response = _register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "user@example.com"
    assert body["full_name"] == "Nguyen Van A"
    assert isinstance(body["id"], int)
    assert "hashed_password" not in body
    assert "password" not in body


def test_duplicate_email_returns_409(client: TestClient) -> None:
    assert _register(client).status_code == 201

    response = _register(client, email="USER@example.com")

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_email_is_normalized(client: TestClient) -> None:
    response = _register(client, email="  User@Example.COM  ")

    assert response.status_code == 201
    assert response.json()["email"] == "user@example.com"


def test_weak_password_returns_422(client: TestClient) -> None:
    response = _register(client, password="short")

    assert response.status_code == 422


def test_hashed_password_is_stored_not_plaintext(
    client: TestClient,
    db_session: Session,
) -> None:
    response = _register(client)
    assert response.status_code == 201

    user = db_session.scalar(select(User).where(User.email == "user@example.com"))

    assert user is not None
    assert user.hashed_password != REGISTER_PAYLOAD["password"]
    assert user.hashed_password.startswith("$argon2id$")
    assert verify_password(REGISTER_PAYLOAD["password"], user.hashed_password)


def test_login_returns_token(client: TestClient) -> None:
    assert _register(client).status_code == 201

    response = _login(client, "USER@example.com", "SecurePassword123!")

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600
    assert body["access_token"]
    assert body["user"]["email"] == "user@example.com"
    assert "hashed_password" not in body["user"]


def test_login_with_wrong_password_returns_401(client: TestClient) -> None:
    assert _register(client).status_code == 201

    response = _login(client, "user@example.com", "WrongPassword123!")

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_with_unknown_email_returns_same_generic_message(
    client: TestClient,
) -> None:
    assert _register(client).status_code == 201

    unknown = _login(client, "missing@example.com", "SecurePassword123!")

    assert unknown.status_code == 401
    assert unknown.json()["detail"] == "Incorrect email or password"


def test_inactive_account_is_rejected(
    client: TestClient,
    db_session: Session,
) -> None:
    assert _register(client).status_code == 201

    user = db_session.scalar(select(User).where(User.email == "user@example.com"))
    assert user is not None
    user.is_active = False
    db_session.commit()

    response = _login(client, "user@example.com", "SecurePassword123!")

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_me_returns_current_user(client: TestClient) -> None:
    register_response = _register(client)
    user_id = register_response.json()["id"]
    token = create_access_token(user_id)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user_id
    assert body["email"] == "user@example.com"
    assert "hashed_password" not in body


def test_me_without_token_returns_401(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.headers.get("WWW-Authenticate") == "Bearer"


def test_me_with_invalid_token_returns_401(client: TestClient) -> None:
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )

    assert response.status_code == 401


def test_me_with_expired_token_returns_401(client: TestClient) -> None:
    register_response = _register(client)
    user_id = register_response.json()["id"]
    token = create_access_token(user_id, expires_delta=timedelta(seconds=-30))

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_me_with_nonexistent_user_returns_401(client: TestClient) -> None:
    token = create_access_token(999999)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_logout_returns_200_when_authenticated(client: TestClient) -> None:
    register_response = _register(client)
    token = create_access_token(register_response.json()["id"])

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Successfully logged out"}


def test_logout_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/auth/logout")

    assert response.status_code == 401
