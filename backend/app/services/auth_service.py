"""Authentication business logic."""

from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserLogin, UserRegister


class EmailAlreadyExistsError(Exception):
    """Raised when registering an email that is already in use."""


class InvalidCredentialsError(Exception):
    """Raised for unknown emails, wrong passwords, or inactive accounts."""


def normalize_email(email: str) -> str:
    """Trim surrounding whitespace and lowercase an email address."""
    return email.strip().lower()


class AuthService:
    """Coordinates user registration and authentication."""

    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def register(self, payload: UserRegister) -> User:
        email = normalize_email(str(payload.email))

        if self.user_repository.get_by_email(email) is not None:
            raise EmailAlreadyExistsError

        user = User(
            email=email,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
        )

        try:
            return self.user_repository.create(user)
        except IntegrityError as exc:
            self.user_repository.rollback()
            raise EmailAlreadyExistsError from exc

    def authenticate(self, payload: UserLogin) -> User:
        email = normalize_email(str(payload.email))
        user = self.user_repository.get_by_email(email)

        if user is None:
            # Perform a dummy verification so unknown emails cost the same as
            # a wrong password, then fail with the same generic error.
            verify_password(payload.password, DUMMY_PASSWORD_HASH)
            raise InvalidCredentialsError

        if not verify_password(payload.password, user.hashed_password):
            raise InvalidCredentialsError

        if not user.is_active:
            raise InvalidCredentialsError

        return user

    def login(self, payload: UserLogin) -> tuple[str, int, User]:
        user = self.authenticate(payload)
        access_token = create_access_token(user.id)
        expires_in = get_settings().access_token_expire_minutes * 60
        return access_token, expires_in, user
