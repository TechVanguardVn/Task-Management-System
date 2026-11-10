"""Create the tasks table.

Revision ID: 002
Revises: 001
Create Date: 2026-11-09
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

INDEXES = (
    "ix_tasks_user_created_at",
    "ix_tasks_user_status",
    "ix_tasks_user_priority",
    "ix_tasks_user_due_date",
)


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.Unicode(length=200), nullable=False),
        sa.Column("description", sa.Unicode(), nullable=True),
        sa.Column(
            "status",
            sa.Unicode(length=20),
            nullable=False,
            server_default="TODO",
        ),
        sa.Column(
            "priority",
            sa.Unicode(length=20),
            nullable=False,
            server_default="MEDIUM",
        ),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_tasks"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_tasks_user_id_users",
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "status IN ('TODO', 'IN_PROGRESS', 'DONE')",
            name=op.f("ck_tasks_status"),
        ),
        sa.CheckConstraint(
            "priority IN ('LOW', 'MEDIUM', 'HIGH')",
            name=op.f("ck_tasks_priority"),
        ),
    )

    op.create_index(
        "ix_tasks_user_created_at",
        "tasks",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_tasks_user_status",
        "tasks",
        ["user_id", "status"],
    )
    op.create_index(
        "ix_tasks_user_priority",
        "tasks",
        ["user_id", "priority"],
    )
    op.create_index(
        "ix_tasks_user_due_date",
        "tasks",
        ["user_id", "due_date"],
    )


def downgrade() -> None:
    for index_name in reversed(INDEXES):
        op.drop_index(index_name, table_name="tasks")

    op.drop_table("tasks")
