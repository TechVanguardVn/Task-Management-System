"""Pydantic request and response schemas for tasks."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.task import TaskPriority, TaskStatus

TITLE_MIN_LENGTH = 1
TITLE_MAX_LENGTH = 200


def _strip_title(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip()
    return value


def _normalize_due_date(value: datetime | None) -> datetime | None:
    """Require an explicit timezone and normalize offset-aware values to UTC.

    Storing naive datetimes would make comparisons ambiguous, and SQLite does
    not preserve offsets. Rejecting naive input keeps one unambiguous instant
    across SQLite tests and SQL Server.
    """
    if value is None:
        return None
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("due_date must include a timezone offset")
    return value.astimezone(UTC)


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=TITLE_MIN_LENGTH, max_length=TITLE_MAX_LENGTH)
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: datetime | None = None

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: Any) -> Any:
        return _strip_title(value)

    @field_validator("due_date")
    @classmethod
    def normalize_due_date(cls, value: datetime | None) -> datetime | None:
        return _normalize_due_date(value)


class TaskUpdate(BaseModel):
    """Full-update payload: every field key is required."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=TITLE_MIN_LENGTH, max_length=TITLE_MAX_LENGTH)
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: Any) -> Any:
        return _strip_title(value)

    @field_validator("due_date")
    @classmethod
    def normalize_due_date(cls, value: datetime | None) -> datetime | None:
        return _normalize_due_date(value)


class TaskStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: TaskStatus


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime
