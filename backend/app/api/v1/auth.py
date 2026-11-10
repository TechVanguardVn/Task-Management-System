"""Authentication HTTP endpoints."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    LogoutResponse,
    TokenResponse,
    UserLogin,
    UserPublic,
    UserRegister,
)
from app.services.auth_service import (
    AuthService,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

INVALID_CREDENTIALS_DETAIL = "Incorrect email or password"


def _build_service(db: Session) -> AuthService:
    return AuthService(UserRepository(db))


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: UserRegister, db: DbSession) -> User:
    service = _build_service(db)
    try:
        return service.register(payload)
    except EmailAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive an access token",
)
def login(payload: UserLogin, db: DbSession) -> TokenResponse:
    service = _build_service(db)
    try:
        access_token, expires_in, user = service.login(payload)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=UserPublic.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Return the authenticated user's profile",
)
def read_current_user(current_user: CurrentUser) -> User:
    return current_user


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Log out the current client session",
)
def logout(_current_user: CurrentUser) -> LogoutResponse:
    """Confirm logout.

    JWTs are stateless: this endpoint does not and cannot revoke the token.
    The client is responsible for discarding its stored access token. The
    token remains technically valid until its expiration time.
    """
    return LogoutResponse(message="Successfully logged out")
