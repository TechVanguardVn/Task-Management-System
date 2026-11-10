"""Database access layer for dashboard statistics.

Both queries are always scoped by the owning user id and never load all tasks
into Python for counting.
"""

from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus

UPCOMING_DEADLINE_LIMIT = 5


class DashboardRepository:
    """Database access layer for the authenticated user's dashboard."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_task_statistics(self, user_id: int) -> dict[str, int]:
        """Return status counters in one conditional aggregation query."""
        statement = (
            select(
                func.count(Task.id).label("total_tasks"),
                func.count(
                    case((Task.status == TaskStatus.DONE.value, 1))
                ).label("completed_tasks"),
                func.count(
                    case((Task.status == TaskStatus.IN_PROGRESS.value, 1))
                ).label("in_progress_tasks"),
                func.count(
                    case((Task.status == TaskStatus.TODO.value, 1))
                ).label("todo_tasks"),
            )
            .where(Task.user_id == user_id)
        )

        row = self.session.execute(statement).one()
        return {
            "total_tasks": int(row.total_tasks),
            "completed_tasks": int(row.completed_tasks),
            "in_progress_tasks": int(row.in_progress_tasks),
            "todo_tasks": int(row.todo_tasks),
        }

    def get_upcoming_deadlines(
        self,
        user_id: int,
        now: datetime,
        limit: int = UPCOMING_DEADLINE_LIMIT,
    ) -> list[Task]:
        """Return the user's nearest future deadlines, excluding completed tasks."""
        statement = (
            select(Task)
            .where(
                Task.user_id == user_id,
                Task.due_date.is_not(None),
                Task.due_date >= now,
                Task.status != TaskStatus.DONE.value,
            )
            .order_by(Task.due_date.asc(), Task.id.asc())
            .limit(limit)
        )
        return list(self.session.scalars(statement).all())
