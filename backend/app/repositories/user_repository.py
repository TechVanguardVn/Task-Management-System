"""Persistence operations for the User entity."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Database access layer for users."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.session.scalar(statement)

    def create(self, user: User) -> User:
        """Persist a new user and return the refreshed instance.

        Raises:
            sqlalchemy.exc.IntegrityError: If a database constraint such as the
                unique email constraint is violated.
        """
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def rollback(self) -> None:
        self.session.rollback()
