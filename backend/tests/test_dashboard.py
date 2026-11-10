"""Dashboard statistics, upcoming deadlines, timezone, and isolation tests."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import event, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.task import Task
from app.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard_service import DashboardService

PASSWORD = "SecurePassword123!"
STATS_URL = "/api/v1/dashboard/stats"
FIXED_NOW = datetime(2026, 11, 20, 9, 0, tzinfo=UTC)

FUTURE_DUE_DATE = "2999-01-01T00:00:00Z"
PAST_DUE_DATE = "2000-01-01T00:00:00Z"


def _create_user(
    db_session: Session,
    email: str,
    full_name: str = "Test User",
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(PASSWORD),
        full_name=full_name,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def _payload(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "title": "Task title",
        "description": "Task description",
        "status": "TODO",
        "priority": "MEDIUM",
        "due_date": None,
    }
    data.update(overrides)
    return data


def _create_task(
    client: TestClient,
    user: User,
    **overrides: object,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/tasks",
        json=_payload(**overrides),
        headers=_headers(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _get_stats(
    client: TestClient,
    user: User | None,
) -> object:
    headers = _headers(user) if user is not None else {}
    return client.get(STATS_URL, headers=headers)


def _service(db_session: Session) -> DashboardService:
    return DashboardService(DashboardRepository(db_session))


def test_empty_account_returns_zero_counters(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "empty@example.com")

    response = _get_stats(client, user)

    assert response.status_code == 200
    assert response.json() == {
        "total_tasks": 0,
        "completed_tasks": 0,
        "in_progress_tasks": 0,
        "todo_tasks": 0,
        "upcoming_deadlines": [],
    }


def test_empty_account_returns_no_upcoming_deadlines(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "empty@example.com")

    body = _get_stats(client, user).json()

    assert body["upcoming_deadlines"] == []


def test_mixed_statuses_returns_correct_counters(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "mixed@example.com")
    _create_task(client, user, title="todo-none")
    _create_task(client, user, title="todo-future", due_date=FUTURE_DUE_DATE)
    _create_task(
        client,
        user,
        title="progress-future",
        status="IN_PROGRESS",
        due_date=FUTURE_DUE_DATE,
    )
    _create_task(
        client,
        user,
        title="done-future",
        status="DONE",
        due_date=FUTURE_DUE_DATE,
    )

    body = _get_stats(client, user).json()

    assert body["total_tasks"] == 4
    assert body["completed_tasks"] == 1
    assert body["in_progress_tasks"] == 1
    assert body["todo_tasks"] == 2
    assert {item["title"] for item in body["upcoming_deadlines"]} == {
        "todo-future",
        "progress-future",
    }


def test_total_equals_sum_of_status_counters(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "invariant@example.com")
    for index in range(2):
        _create_task(client, user, title=f"todo-{index}")
    for index in range(3):
        _create_task(
            client,
            user,
            title=f"progress-{index}",
            status="IN_PROGRESS",
        )
    for index in range(4):
        _create_task(client, user, title=f"done-{index}", status="DONE")

    body = _get_stats(client, user).json()

    assert body["total_tasks"] == 9
    assert body["total_tasks"] == (
        body["completed_tasks"]
        + body["in_progress_tasks"]
        + body["todo_tasks"]
    )


def test_statistics_use_one_conditional_aggregation_query(
    client: TestClient,
    db_session: Session,
    engine: Engine,
) -> None:
    user = _create_user(db_session, "aggregate@example.com")
    _create_task(client, user, title="one")
    _create_task(client, user, title="two", status="DONE")

    statements: list[str] = []

    def _capture(
        _connection: object,
        _cursor: object,
        statement: str,
        _parameters: object,
        _context: object,
        _executemany: object,
    ) -> None:
        statements.append(statement)

    event.listen(engine, "before_cursor_execute", _capture)
    try:
        DashboardRepository(db_session).get_task_statistics(user.id)
    finally:
        event.remove(engine, "before_cursor_execute", _capture)

    task_selects = [
        statement for statement in statements if "from tasks" in statement.lower()
    ]

    assert len(task_selects) == 1
    assert "count(" in task_selects[0].lower()
    assert "case when" in task_selects[0].lower()


def test_multiple_users_counters_remain_separate(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(client, user_a, title="a-todo")
    _create_task(client, user_b, title="b-todo")
    _create_task(client, user_b, title="b-done", status="DONE")

    body_a = _get_stats(client, user_a).json()
    body_b = _get_stats(client, user_b).json()

    assert body_a["total_tasks"] == 1
    assert body_a["todo_tasks"] == 1
    assert body_a["completed_tasks"] == 0
    assert body_b["total_tasks"] == 2
    assert body_b["todo_tasks"] == 1
    assert body_b["completed_tasks"] == 1


def test_upcoming_includes_future_todo(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "upcoming@example.com")
    _create_task(client, user, title="future-todo", due_date=FUTURE_DUE_DATE)

    body = _get_stats(client, user).json()

    assert [item["title"] for item in body["upcoming_deadlines"]] == [
        "future-todo"
    ]
    assert body["upcoming_deadlines"][0]["due_date"].endswith("Z")


def test_upcoming_includes_future_in_progress(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "upcoming@example.com")
    _create_task(
        client,
        user,
        title="future-progress",
        status="IN_PROGRESS",
        due_date=FUTURE_DUE_DATE,
    )

    body = _get_stats(client, user).json()

    assert [item["title"] for item in body["upcoming_deadlines"]] == [
        "future-progress"
    ]


def test_upcoming_excludes_done_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "upcoming@example.com")
    _create_task(
        client,
        user,
        title="future-done",
        status="DONE",
        due_date=FUTURE_DUE_DATE,
    )

    body = _get_stats(client, user).json()

    assert body["upcoming_deadlines"] == []


def test_upcoming_excludes_overdue_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "upcoming@example.com")
    _create_task(client, user, title="overdue", due_date=PAST_DUE_DATE)

    body = _get_stats(client, user).json()

    assert body["upcoming_deadlines"] == []


def test_upcoming_excludes_tasks_without_due_date(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "upcoming@example.com")
    _create_task(client, user, title="no-deadline", due_date=None)

    body = _get_stats(client, user).json()

    assert body["upcoming_deadlines"] == []


def test_upcoming_ordered_by_due_date_ascending(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "order@example.com")
    _create_task(client, user, title="third", due_date="2999-01-03T00:00:00Z")
    _create_task(client, user, title="first", due_date="2999-01-01T00:00:00Z")
    _create_task(client, user, title="second", due_date="2999-01-02T00:00:00Z")

    body = _get_stats(client, user).json()

    assert [item["title"] for item in body["upcoming_deadlines"]] == [
        "first",
        "second",
        "third",
    ]


def test_upcoming_equal_due_dates_ordered_by_id_ascending(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "tie@example.com")
    first = _create_task(
        client,
        user,
        title="first",
        due_date="2999-02-01T00:00:00Z",
    )
    second = _create_task(
        client,
        user,
        title="second",
        due_date="2999-02-01T00:00:00Z",
    )

    body = _get_stats(client, user).json()

    assert second["id"] > first["id"]
    assert [item["title"] for item in body["upcoming_deadlines"]] == [
        "first",
        "second",
    ]
    assert [item["id"] for item in body["upcoming_deadlines"]] == [
        first["id"],
        second["id"],
    ]


def test_upcoming_returns_at_most_five(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "limit@example.com")
    for day in range(1, 8):
        _create_task(
            client,
            user,
            title=f"day-{day:02d}",
            due_date=f"2999-03-{day:02d}T00:00:00Z",
        )

    body = _get_stats(client, user).json()

    assert len(body["upcoming_deadlines"]) == 5
    assert [item["title"] for item in body["upcoming_deadlines"]] == [
        "day-01",
        "day-02",
        "day-03",
        "day-04",
        "day-05",
    ]


def test_upcoming_includes_due_date_exactly_now(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "boundary@example.com")
    _create_task(
        client,
        user,
        title="exactly-now",
        due_date=FIXED_NOW.isoformat(),
    )

    stats = _service(db_session).get_dashboard_stats(user.id, now=FIXED_NOW)

    assert [item.title for item in stats.upcoming_deadlines] == ["exactly-now"]


def test_upcoming_excludes_one_second_before_now(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "boundary@example.com")
    _create_task(
        client,
        user,
        title="one-second-before",
        due_date=(FIXED_NOW - timedelta(seconds=1)).isoformat(),
    )

    stats = _service(db_session).get_dashboard_stats(user.id, now=FIXED_NOW)

    assert stats.upcoming_deadlines == []


def test_upcoming_includes_one_second_after_now(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "boundary@example.com")
    _create_task(
        client,
        user,
        title="one-second-after",
        due_date=(FIXED_NOW + timedelta(seconds=1)).isoformat(),
    )

    stats = _service(db_session).get_dashboard_stats(user.id, now=FIXED_NOW)

    assert [item.title for item in stats.upcoming_deadlines] == [
        "one-second-after"
    ]


def test_utc_aware_timestamps_are_compared_correctly(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "tz@example.com")
    _create_task(
        client,
        user,
        title="utc-task",
        due_date="2026-11-20T10:00:00Z",
    )

    stats = _service(db_session).get_dashboard_stats(
        user.id,
        now=datetime(2026, 11, 20, 9, 0, tzinfo=UTC),
    )

    assert [item.title for item in stats.upcoming_deadlines] == ["utc-task"]


def test_non_zero_offset_is_normalized_to_utc(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "tz@example.com")
    task = _create_task(
        client,
        user,
        title="offset-task",
        due_date="2026-11-20T16:00:00+07:00",
    )

    stored_due_date = db_session.scalar(
        select(Task.due_date).where(Task.id == task["id"])
    )
    assert stored_due_date == datetime(2026, 11, 20, 9, 0)

    included = _service(db_session).get_dashboard_stats(
        user.id,
        now=datetime(2026, 11, 20, 8, 0, tzinfo=UTC),
    )
    excluded = _service(db_session).get_dashboard_stats(
        user.id,
        now=datetime(2026, 11, 20, 10, 0, tzinfo=UTC),
    )

    assert [item.title for item in included.upcoming_deadlines] == [
        "offset-task"
    ]
    assert (
        included.upcoming_deadlines[0].due_date
        == datetime(2026, 11, 20, 9, 0, tzinfo=UTC)
    )
    assert excluded.upcoming_deadlines == []


def test_naive_due_date_is_rejected_on_create(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "naive@example.com")

    response = client.post(
        "/api/v1/tasks",
        json=_payload(due_date="2026-11-20T09:00:00"),
        headers=_headers(user),
    )

    assert response.status_code == 422


def test_naive_due_date_is_rejected_on_update(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "naive@example.com")
    task = _create_task(client, user)

    response = client.put(
        f"/api/v1/tasks/{task['id']}",
        json=_payload(due_date="2026-11-20T09:00:00"),
        headers=_headers(user),
    )

    assert response.status_code == 422


def test_user_a_statistics_exclude_user_b_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(client, user_a, title="a-todo")
    _create_task(client, user_b, title="b-done", status="DONE")
    _create_task(
        client,
        user_b,
        title="b-progress",
        status="IN_PROGRESS",
        due_date=FUTURE_DUE_DATE,
    )

    body = _get_stats(client, user_a).json()

    assert body["total_tasks"] == 1
    assert body["completed_tasks"] == 0
    assert body["in_progress_tasks"] == 0
    assert body["todo_tasks"] == 1
    assert body["upcoming_deadlines"] == []


def test_user_a_upcoming_deadlines_exclude_user_b_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(
        client,
        user_b,
        title="b-future",
        due_date=FUTURE_DUE_DATE,
    )

    body = _get_stats(client, user_a).json()

    assert body["upcoming_deadlines"] == []


def test_user_b_with_fifty_tasks_does_not_change_user_a(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(client, user_a, title="a-todo")
    _create_task(client, user_a, title="a-done", status="DONE")
    for index in range(50):
        _create_task(
            client,
            user_b,
            title=f"b-{index}",
            due_date=FUTURE_DUE_DATE,
        )

    body = _get_stats(client, user_a).json()

    assert body["total_tasks"] == 2
    assert body["completed_tasks"] == 1
    assert body["in_progress_tasks"] == 0
    assert body["todo_tasks"] == 1
    assert body["upcoming_deadlines"] == []


def test_unauthenticated_request_returns_401(
    client: TestClient,
) -> None:
    response = client.get(STATS_URL)

    assert response.status_code == 401


def test_invalid_token_returns_401(
    client: TestClient,
) -> None:
    response = client.get(
        STATS_URL,
        headers={"Authorization": "Bearer not-a-valid-token"},
    )

    assert response.status_code == 401


def test_service_rejects_naive_reference_time(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "naive-now@example.com")

    try:
        _service(db_session).get_dashboard_stats(
            user.id,
            now=datetime(2026, 11, 20, 9, 0),
        )
    except ValueError as exc:
        assert "timezone" in str(exc)
    else:
        raise AssertionError("Expected ValueError for a naive reference time")


def test_dashboard_service_returns_typed_response(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "typed@example.com")

    stats = _service(db_session).get_dashboard_stats(user.id, now=FIXED_NOW)

    assert isinstance(stats, DashboardStatsResponse)
    assert stats.total_tasks == 0
