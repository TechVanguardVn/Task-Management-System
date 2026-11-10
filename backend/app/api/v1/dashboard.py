"""Dashboard HTTP endpoints, scoped to the authenticated user."""

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _build_service(db: Session) -> DashboardService:
    return DashboardService(DashboardRepository(db))


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get the current user's dashboard statistics",
)
def get_dashboard_stats(
    current_user: CurrentUser,
    db: DbSession,
) -> DashboardStatsResponse:
    service = _build_service(db)
    return service.get_dashboard_stats(current_user.id)
