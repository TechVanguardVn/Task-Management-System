"""Dashboard business logic."""

from datetime import UTC, datetime

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import DashboardStatsResponse, UpcomingDeadlineTask


class DashboardService:
    """Assembles dashboard statistics for the authenticated user."""

    def __init__(self, dashboard_repository: DashboardRepository) -> None:
        self.dashboard_repository = dashboard_repository

    def get_dashboard_stats(
        self,
        user_id: int,
        now: datetime | None = None,
    ) -> DashboardStatsResponse:
        """Return one consistent dashboard snapshot for the given user.

        A single reference timestamp is captured once and reused for the
        upcoming-deadline query so the response cannot straddle a clock tick.
        """
        reference = datetime.now(UTC) if now is None else now
        if reference.tzinfo is None or reference.utcoffset() is None:
            raise ValueError("now must include a timezone offset")
        reference = reference.astimezone(UTC)

        statistics = self.dashboard_repository.get_task_statistics(user_id)
        deadlines = self.dashboard_repository.get_upcoming_deadlines(
            user_id=user_id,
            now=reference,
        )

        return DashboardStatsResponse(
            total_tasks=max(0, statistics["total_tasks"]),
            completed_tasks=max(0, statistics["completed_tasks"]),
            in_progress_tasks=max(0, statistics["in_progress_tasks"]),
            todo_tasks=max(0, statistics["todo_tasks"]),
            upcoming_deadlines=[
                UpcomingDeadlineTask.model_validate(task) for task in deadlines
            ],
        )
