"""Persistence operations for the Task entity.

Every method is scoped by the owning user id. There is intentionally no
unscoped task lookup anywhere in this repository.
"""

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.models.task import Task, TaskPriority, TaskStatus, utcnow
from app.schemas.task import TaskCreate, TaskUpdate


class TaskRepository:
    """Database access layer for tasks."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, task_id: int, user_id: int) -> Task | None:
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id,
        )
        return self.session.scalar(statement)

    def list_tasks(
        self,
        user_id: int,
        search: str | None,
        status: TaskStatus | None,
        priority: TaskPriority | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Task], int]:
        """Return one page of matching tasks and the total matching count.

        The same ownership-scoped filter conditions are used by both the count
        and data queries so pagination metadata can never leak other users'
        tasks.
        """
        conditions = self._filter_conditions(
            user_id=user_id,
            search=search,
            status=status,
            priority=priority,
        )

        count_statement = (
            select(func.count())
            .select_from(Task)
            .where(*conditions)
        )
        total = int(self.session.scalar(count_statement) or 0)

        data_statement = (
            select(Task)
            .where(*conditions)
            .order_by(Task.created_at.desc(), Task.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.session.scalars(data_statement).all())

        return items, total

    @staticmethod
    def _filter_conditions(
        user_id: int,
        search: str | None,
        status: TaskStatus | None,
        priority: TaskPriority | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = [Task.user_id == user_id]

        if search:
            conditions.append(Task.title.icontains(search, autoescape=True))
        if status is not None:
            conditions.append(Task.status == status.value)
        if priority is not None:
            conditions.append(Task.priority == priority.value)

        return conditions

    def create(self, user_id: int, payload: TaskCreate) -> Task:
        task = Task(
            user_id=user_id,
            title=payload.title,
            description=payload.description,
            status=payload.status.value,
            priority=payload.priority.value,
            due_date=payload.due_date,
        )
        self.session.add(task)
        self._commit()
        self.session.refresh(task)
        return task

    def update(
        self,
        task_id: int,
        user_id: int,
        payload: TaskUpdate,
    ) -> Task | None:
        task = self.get_by_id(task_id, user_id)
        if task is None:
            return None

        task.title = payload.title
        task.description = payload.description
        task.status = payload.status.value
        task.priority = payload.priority.value
        task.due_date = payload.due_date
        task.updated_at = utcnow()

        self._commit()
        self.session.refresh(task)
        return task

    def update_status(
        self,
        task_id: int,
        user_id: int,
        status: TaskStatus,
    ) -> Task | None:
        task = self.get_by_id(task_id, user_id)
        if task is None:
            return None

        task.status = status.value
        task.updated_at = utcnow()

        self._commit()
        self.session.refresh(task)
        return task

    def delete(self, task_id: int, user_id: int) -> bool:
        task = self.get_by_id(task_id, user_id)
        if task is None:
            return False

        self.session.delete(task)
        self._commit()
        return True

    def _commit(self) -> None:
        try:
            self.session.commit()
        except SQLAlchemyError:
            self.session.rollback()
            raise
