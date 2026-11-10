"""Tests for database pre-start readiness check."""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.exc import OperationalError

from app.db.pre_start import wait_for_database


def test_wait_for_database_empty_url() -> None:
    """Empty database URL returns immediately without error."""
    wait_for_database("")
    wait_for_database("   ")


def test_wait_for_database_sqlite_success() -> None:
    """SQLite in-memory URL succeeds immediately."""
    wait_for_database("sqlite+pysqlite://", timeout_seconds=5)


def test_wait_for_database_invalid_dbname_rejected() -> None:
    """Dangerous or non-alphanumeric database names are rejected."""
    mock_engine = MagicMock()
    mock_conn = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_conn

    dangerous_url = "mssql+pyodbc://sa:pass@localhost:1433/invalid;DROP;--?driver=ODBC+Driver+18+for+SQL+Server"
    with (
        patch("app.db.pre_start.create_engine", return_value=mock_engine),
        pytest.raises(ValueError, match="Invalid target database name"),
    ):
        wait_for_database(dangerous_url, timeout_seconds=1, interval_seconds=0.01)


def test_wait_for_database_unreachable_timeout() -> None:
    """Unreachable host times out cleanly after specified duration."""
    mock_error = OperationalError("connection failed", None, None)
    with patch("app.db.pre_start.create_engine", side_effect=mock_error):
        unreachable_url = "mssql+pyodbc://sa:pass@127.0.0.1:1433/testdb?driver=ODBC+Driver+18+for+SQL+Server"
        with pytest.raises(TimeoutError, match="Database readiness check failed"):
            wait_for_database(unreachable_url, timeout_seconds=0.05, interval_seconds=0.01)
