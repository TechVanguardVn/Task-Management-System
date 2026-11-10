"""Tests for database seeder."""

from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db.seed import (
    DEMO_EMAIL,
    DEMO_FULL_NAME,
    DEMO_PASSWORD,
    seed_database,
)
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)


def test_seed_database_success(db_session: Session) -> None:
    """Seeder creates demo user and representative tasks with all required variations."""
    result = seed_database(db_session, app_env="development")

    assert result["users_created"] == 1
    assert result["tasks_created"] >= 8

    user = db_session.scalars(select(User).where(User.email == DEMO_EMAIL)).first()
    assert user is not None
    assert user.full_name == DEMO_FULL_NAME
    assert user.is_active is True

    # Password must be hashed with Argon2id and NOT stored in plaintext
    assert user.hashed_password != DEMO_PASSWORD
    assert user.hashed_password.startswith("$argon2id$")
    assert verify_password(DEMO_PASSWORD, user.hashed_password) is True

    tasks = db_session.scalars(select(Task).where(Task.user_id == user.id)).all()
    assert len(tasks) >= 8

    # Verify task statuses
    statuses = {t.status for t in tasks}
    assert TaskStatus.TODO.value in statuses
    assert TaskStatus.IN_PROGRESS.value in statuses
    assert TaskStatus.DONE.value in statuses

    # Verify task priorities
    priorities = {t.priority for t in tasks}
    assert TaskPriority.LOW.value in priorities
    assert TaskPriority.MEDIUM.value in priorities
    assert TaskPriority.HIGH.value in priorities

    # Verify deadline variations: upcoming, overdue, NULL
    now = datetime.now(UTC)
    has_overdue = any(
        t.due_date is not None and _as_utc(t.due_date) < now for t in tasks
    )
    has_upcoming = any(
        t.due_date is not None and _as_utc(t.due_date) > now for t in tasks
    )
    has_null = any(t.due_date is None for t in tasks)

    assert has_overdue is True
    assert has_upcoming is True
    assert has_null is True


def test_seed_database_idempotent_no_duplicates(db_session: Session) -> None:
    """Repeated runs of the seeder do not create duplicate users or tasks."""
    first_run = seed_database(db_session, app_env="development")
    assert first_run["users_created"] == 1
    initial_tasks_count = first_run["tasks_created"]

    # Second run immediately after
    second_run = seed_database(db_session, app_env="development")
    assert second_run["users_created"] == 0
    assert second_run["tasks_created"] == 0

    all_users = db_session.scalars(select(User).where(User.email == DEMO_EMAIL)).all()
    assert len(all_users) == 1

    all_tasks = db_session.scalars(select(Task).where(Task.user_id == all_users[0].id)).all()
    assert len(all_tasks) == initial_tasks_count


def test_seed_database_preserves_existing_user_password(db_session: Session) -> None:
    """Seeder does not overwrite or reset an existing user's password."""
    custom_password = "MyCustomPassword999!"
    existing_user = User(
        email=DEMO_EMAIL,
        full_name="Existing Demo User",
        hashed_password=hash_password(custom_password),
        is_active=True,
    )
    db_session.add(existing_user)
    db_session.commit()

    result = seed_database(db_session, app_env="test")
    assert result["users_created"] == 0

    user = db_session.scalars(select(User).where(User.email == DEMO_EMAIL)).first()
    assert user is not None
    assert verify_password(custom_password, user.hashed_password) is True
    assert verify_password(DEMO_PASSWORD, user.hashed_password) is False


def test_seed_database_preserves_existing_tasks(db_session: Session) -> None:
    """Existing tasks with matching titles are preserved without being overwritten."""
    user = User(
        email=DEMO_EMAIL,
        full_name=DEMO_FULL_NAME,
        hashed_password=hash_password(DEMO_PASSWORD),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    custom_description = "Mô tả tùy chỉnh không được bị ghi đè"
    existing_task = Task(
        user_id=user.id,
        title="Thiết lập môi trường làm việc",
        description=custom_description,
        status=TaskStatus.TODO.value,
        priority=TaskPriority.LOW.value,
        due_date=None,
    )
    db_session.add(existing_task)
    db_session.commit()

    result = seed_database(db_session, app_env="test")
    # All tasks except the existing one should be created
    assert result["users_created"] == 0

    task = db_session.scalars(
        select(Task).where(
            Task.user_id == user.id,
            Task.title == "Thiết lập môi trường làm việc",
        )
    ).first()
    assert task is not None
    assert task.description == custom_description
    assert task.status == TaskStatus.TODO.value
    assert task.priority == TaskPriority.LOW.value


def test_seed_database_refuses_production(db_session: Session) -> None:
    """Seeding in production environment raises RuntimeError and makes no modifications."""
    with pytest.raises(RuntimeError, match="refused in production environment"):
        seed_database(db_session, app_env="production")

    users_count = len(db_session.scalars(select(User)).all())
    assert users_count == 0
