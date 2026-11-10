"""Pydantic response schemas for the dashboard."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.task import TaskPriority, TaskStatus


class UpcomingDeadlineTask(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime

    @field_validator("due_date")
    @classmethod
    def normalize_due_date(cls, value: datetime) -> datetime:
        """Always expose a UTC-aware deadline.

        Writes are normalized to UTC, so a naive value read back from SQLite
        represents that same UTC instant. SQL Server DATETIMEOFFSET values are
        converted to UTC explicitly.
        """
        if value.tzinfo is None or value.utcoffset() is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class DashboardStatsResponse(BaseModel):
    total_tasks: int = Field(ge=0)
    completed_tasks: int = Field(ge=0)
    in_progress_tasks: int = Field(ge=0)
    todo_tasks: int = Field(ge=0)
    upcoming_deadlines: list[UpcomingDeadlineTask] = Field(default_factory=list)
