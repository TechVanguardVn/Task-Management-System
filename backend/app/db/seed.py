"""Database seeder for development and test environments.

Creates a demo user and a representative set of initial tasks.
Ensures strict idempotency: repeated executions never duplicate users or tasks,
and existing user passwords and task details are never overwritten.
Refuses execution in production environment for safety.
"""

import logging
import sys
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_session_factory
from app.core.security import hash_password
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User

logger = logging.getLogger(__name__)

DEMO_EMAIL = "demo@example.com"
DEMO_FULL_NAME = "Demo User"
DEMO_PASSWORD = "DemoPassword123!"


def check_environment_allowed(app_env: str) -> None:
    """Ensure seeding is only executed in development or test environments."""
    if app_env == "production":
        raise RuntimeError(
            "Database seeding is refused in production environment for safety."
        )


def get_seed_tasks_data() -> list[dict[str, Any]]:
    """Return template data for representative demo tasks.

    Includes all statuses (TODO, IN_PROGRESS, DONE), priorities (LOW, MEDIUM, HIGH),
    and deadline variations (overdue, upcoming, NULL).
    All datetimes are timezone-aware UTC.
    """
    now = datetime.now(UTC)

    return [
        {
            "title": "Thiết lập môi trường làm việc",
            "description": "Cài đặt Docker, cấu hình biến môi trường và chạy thử nghiệm hệ thống cục bộ.",
            "status": TaskStatus.DONE.value,
            "priority": TaskPriority.HIGH.value,
            "due_date": now - timedelta(days=2),
        },
        {
            "title": "Viết tài liệu kiến trúc hệ thống",
            "description": "Mô tả luồng dữ liệu, cơ chế xác thực JWT và lược đồ cơ sở dữ liệu.",
            "status": TaskStatus.DONE.value,
            "priority": TaskPriority.MEDIUM.value,
            "due_date": now - timedelta(days=1),
        },
        {
            "title": "Kiểm thử API Authentication",
            "description": "Viết unit test và integration test cho các endpoint đăng ký, đăng nhập và bảo vệ token.",
            "status": TaskStatus.IN_PROGRESS.value,
            "priority": TaskPriority.HIGH.value,
            "due_date": now + timedelta(days=1),
        },
        {
            "title": "Tối ưu hóa bundle frontend",
            "description": "Áp dụng route-level và modal-level code splitting với React.lazy để đáp ứng ngân sách tải trang.",
            "status": TaskStatus.IN_PROGRESS.value,
            "priority": TaskPriority.MEDIUM.value,
            "due_date": now + timedelta(days=3),
        },
        {
            "title": "Triển khai Docker Compose",
            "description": "Đóng gói backend FastAPI, frontend Nginx và SQL Server 2022 trong môi trường container.",
            "status": TaskStatus.TODO.value,
            "priority": TaskPriority.HIGH.value,
            "due_date": now + timedelta(days=5),
        },
        {
            "title": "Đánh giá bảo mật và CORS",
            "description": "Rà soát cấu hình CORS, headers bảo mật và chính sách mật khẩu người dùng.",
            "status": TaskStatus.TODO.value,
            "priority": TaskPriority.MEDIUM.value,
            "due_date": now + timedelta(days=7),
        },
        {
            "title": "Dọn dẹp backlog kỹ thuật",
            "description": "Kiểm tra các chỉ mục database và tối ưu hóa truy vấn tìm kiếm.",
            "status": TaskStatus.TODO.value,
            "priority": TaskPriority.LOW.value,
            "due_date": None,
        },
        {
            "title": "Khảo sát ý kiến người dùng thử nghiệm",
            "description": "Thu thập phản hồi về trải nghiệm giao diện và các bộ lọc công việc.",
            "status": TaskStatus.TODO.value,
            "priority": TaskPriority.LOW.value,
            "due_date": None,
        },
        {
            "title": "Đồng bộ hóa dữ liệu định kỳ",
            "description": "Kiểm tra cơ chế sao lưu dữ liệu tự động cho các bảng công việc.",
            "status": TaskStatus.IN_PROGRESS.value,
            "priority": TaskPriority.LOW.value,
            "due_date": now - timedelta(hours=6),
        },
    ]


def seed_database(session: Session, app_env: str | None = None) -> dict[str, int]:
    """Seed the database with a demo user and initial tasks.

    Args:
        session: Active SQLAlchemy database session.
        app_env: Target runtime environment. If None, loaded from settings.

    Returns:
        Summary dict containing counts of newly created users and tasks.
    """
    current_env = app_env if app_env is not None else get_settings().app_env
    check_environment_allowed(current_env)

    users_created = 0
    tasks_created = 0

    # 1. Ensure demo user exists without overwriting password if already present
    user_stmt = select(User).where(User.email == DEMO_EMAIL)
    user = session.scalars(user_stmt).first()

    if user is None:
        user = User(
            email=DEMO_EMAIL,
            full_name=DEMO_FULL_NAME,
            hashed_password=hash_password(DEMO_PASSWORD),
            is_active=True,
        )
        session.add(user)
        session.flush()
        users_created += 1
        logger.info("Created demo user: %s", DEMO_EMAIL)
    else:
        logger.info("Demo user already exists: %s (preserving credentials)", DEMO_EMAIL)

    # 2. Query existing tasks for the demo user to ensure idempotency
    existing_tasks_stmt = select(Task.title).where(Task.user_id == user.id)
    existing_titles = set(session.scalars(existing_tasks_stmt).all())

    # 3. Insert only missing tasks
    for task_data in get_seed_tasks_data():
        if task_data["title"] in existing_titles:
            continue

        task = Task(
            user_id=user.id,
            title=task_data["title"],
            description=task_data["description"],
            status=task_data["status"],
            priority=task_data["priority"],
            due_date=task_data["due_date"],
        )
        session.add(task)
        tasks_created += 1

    session.commit()
    logger.info(
        "Seeding completed. Users created: %d, Tasks created: %d.",
        users_created,
        tasks_created,
    )

    return {"users_created": users_created, "tasks_created": tasks_created}


def main() -> None:
    """CLI entrypoint for running the database seeder."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    settings = get_settings()

    try:
        check_environment_allowed(settings.app_env)
    except RuntimeError as err:
        logger.error("Seeding aborted: %s", err)
        sys.exit(1)

    session_factory = get_session_factory()
    with session_factory() as session:
        result = seed_database(session, app_env=settings.app_env)
        print(
            f"Seeding finished successfully. "
            f"Users created: {result['users_created']}, Tasks created: {result['tasks_created']}."
        )


if __name__ == "__main__":
    main()
