"""Task business logic."""

import math

from app.models.task import Task, TaskPriority, TaskStatus
from app.repositories.task_repository import TaskRepository
from app.schemas.common import PaginatedResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate


class TaskNotFoundError(Exception):
    """Raised when a task does not exist or is not owned by the user."""


class TaskService:
    """Coordinates task operations for the authenticated user."""

    def __init__(self, task_repository: TaskRepository) -> None:
        self.task_repository = task_repository

    def create_task(self, user_id: int, payload: TaskCreate) -> Task:
        return self.task_repository.create(user_id, payload)

    def get_task(self, user_id: int, task_id: int) -> Task:
        task = self.task_repository.get_by_id(task_id, user_id)
        if task is None:
            raise TaskNotFoundError
        return task

    def list_tasks(
        self,
        user_id: int,
        search: str | None,
        status: TaskStatus | None,
        priority: TaskPriority | None,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[TaskResponse]:
        normalized_search = search.strip() if search else None
        if normalized_search == "":
            normalized_search = None

        items, total = self.task_repository.list_tasks(
            user_id=user_id,
            search=normalized_search,
            status=status,
            priority=priority,
            page=page,
            page_size=page_size,
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 0

        return PaginatedResponse[TaskResponse](
            items=[TaskResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def update_task(
        self,
        user_id: int,
        task_id: int,
        payload: TaskUpdate,
    ) -> Task:
        task = self.task_repository.update(task_id, user_id, payload)
        if task is None:
            raise TaskNotFoundError
        return task

    def update_task_status(
        self,
        user_id: int,
        task_id: int,
        status: TaskStatus,
    ) -> Task:
        task = self.task_repository.update_status(task_id, user_id, status)
        if task is None:
            raise TaskNotFoundError
        return task

    def delete_task(self, user_id: int, task_id: int) -> None:
        if not self.task_repository.delete(task_id, user_id):
            raise TaskNotFoundError
