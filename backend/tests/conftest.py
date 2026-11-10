"""Pytest fixtures.

The test suite uses an in-memory SQLite database and dependency overrides so
no SQL Server instance (or network access) is required.
"""

import os
import sys
from collections.abc import Generator
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Configure the application for tests before importing app modules.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite://")
os.environ.setdefault(
    "JWT_SECRET",
    "test-secret-key-for-phase-2-tests-only-0123456789abcdef",
)
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.core.database import get_db
from app.db.base import Base
from app.main import app

TEST_DATABASE_URL = "sqlite+pysqlite://"


@pytest.fixture()
def engine() -> Generator[Engine, None, None]:
    test_engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    def _casefold_lower(value: str | None) -> str | None:
        return value.casefold() if value is not None else None

    @event.listens_for(test_engine, "connect")
    def _configure_sqlite_connection(
        _dbapi_connection: object,
        _connection_record: object,
    ) -> None:
        cursor = _dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
        # SQLite's built-in lower() is ASCII-only. Override it with Python
        # casefold so Unicode case-insensitive search can be tested. This is
        # test-only and does not affect SQL Server behavior.
        _dbapi_connection.create_function("lower", 1, _casefold_lower)

    Base.metadata.create_all(bind=test_engine)
    try:
        yield test_engine
    finally:
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def _session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )


@pytest.fixture()
def db_session(engine: Engine) -> Generator[Session, None, None]:
    session = _session_factory(engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(engine: Engine) -> Generator[TestClient, None, None]:
    factory = _session_factory(engine)

    def override_get_db() -> Generator[Session, None, None]:
        session = factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
