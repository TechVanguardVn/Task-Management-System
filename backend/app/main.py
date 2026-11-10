"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import get_settings

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="Task Management System API",
        version="0.1.0",
        description=(
            "Personal task management API with JWT authentication, user-scoped "
            "task CRUD, search and filtering, dashboard statistics, and Kanban "
            "status updates."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    allowed_origins = settings.cors_origins_list
    if allowed_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    application.include_router(api_router, prefix=API_PREFIX)

    @application.get("/health", tags=["Health"], summary="Service health check")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
