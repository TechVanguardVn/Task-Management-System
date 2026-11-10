"""Database readiness check and target database initialization.

Waits until the SQL Server instance accepts authenticated connections,
masks credentials in logs, and ensures the target database exists without
dropping or overwriting existing data.
"""

import logging
import re
import sys
import time

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def wait_for_database(
    database_url: str,
    timeout_seconds: int = 60,
    interval_seconds: float = 2.0,
) -> None:
    """Wait for database readiness and create target database if needed."""
    if not database_url.strip():
        logger.warning("DATABASE_URL is empty; skipping pre-start wait.")
        return

    url = make_url(database_url)
    sanitized_url = url.render_as_string(hide_password=True)
    logger.info("Checking database readiness for %s...", sanitized_url)

    is_mssql = url.drivername.startswith("mssql")
    master_url = url.set(database="master") if is_mssql else url
    target_db = url.database

    start_time = time.monotonic()
    last_error: Exception | None = None

    while time.monotonic() - start_time < timeout_seconds:
        try:
            engine = create_engine(
                master_url,
                poolclass=NullPool,
                isolation_level="AUTOCOMMIT" if is_mssql else None,
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))

                if is_mssql and target_db and target_db.lower() != "master":
                    if not re.match(r"^[A-Za-z0-9_]+$", target_db):
                        raise ValueError(f"Invalid target database name: {target_db}")

                    check_sql = text(
                        "SELECT name FROM sys.databases WHERE name = :dbname"
                    )
                    exists = conn.execute(check_sql, {"dbname": target_db}).scalar()
                    if not exists:
                        logger.info(
                            "Target database '%s' does not exist. Creating...",
                            target_db,
                        )
                        conn.execute(text(f"CREATE DATABASE [{target_db}]"))
                        logger.info(
                            "Target database '%s' created successfully.",
                            target_db,
                        )
                    else:
                        logger.info(
                            "Target database '%s' exists and is ready.",
                            target_db,
                        )

            engine.dispose()
            logger.info("Database connection successfully established.")
            return
        except (SQLAlchemyError, OSError) as exc:
            last_error = exc
            logger.info(
                "Waiting for database to become ready... (elapsed: %ds)",
                int(time.monotonic() - start_time),
            )
            time.sleep(interval_seconds)

    logger.error(
        "Timed out waiting for database readiness after %ds. Last error: %s",
        timeout_seconds,
        last_error,
    )
    raise TimeoutError(
        f"Database readiness check failed within {timeout_seconds} seconds."
    )


def main() -> None:
    """CLI entrypoint for pre-start database readiness check."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    settings = get_settings()
    try:
        wait_for_database(settings.database_url)
    except (SQLAlchemyError, TimeoutError, OSError, ValueError) as err:
        logger.error("Pre-start check failed: %s", err)
        sys.exit(1)


if __name__ == "__main__":
    main()
