"""Task CRUD, search/filter/pagination, ownership, and cascade tests."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.task import Task
from app.models.user import User

PASSWORD = "SecurePassword123!"


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
) -> object:
    return client.post(
        "/api/v1/tasks",
        json=_payload(**overrides),
        headers=_headers(user),
    )


def _list(
    client: TestClient,
    user: User,
    **params: object,
) -> object:
    return client.get(
        "/api/v1/tasks",
        params=params,
        headers=_headers(user),
    )


def test_create_task(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = _create_task(client, user)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Task title"
    assert body["description"] == "Task description"
    assert body["status"] == "TODO"
    assert body["priority"] == "MEDIUM"
    assert body["due_date"] is None
    assert body["user_id"] == user.id


def test_create_task_with_minimal_fields(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = client.post(
        "/api/v1/tasks",
        json={"title": "Minimal"},
        headers=_headers(user),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "TODO"
    assert body["priority"] == "MEDIUM"
    assert body["description"] is None
    assert body["due_date"] is None


def test_create_task_with_past_due_date(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = _create_task(
        client,
        user,
        due_date="2000-01-01T00:00:00Z",
    )

    assert response.status_code == 201
    assert response.json()["due_date"].startswith("2000-01-01")


def test_title_is_trimmed(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = _create_task(client, user, title="  Buy milk  ")

    assert response.status_code == 201
    assert response.json()["title"] == "Buy milk"


def test_list_own_tasks_newest_first(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    first = _create_task(client, user, title="First").json()
    second = _create_task(client, user, title="Second").json()

    response = client.get("/api/v1/tasks", headers=_headers(user))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    ids = [item["id"] for item in body["items"]]
    assert ids == [second["id"], first["id"]]


def test_get_own_task(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    task = _create_task(client, user).json()

    response = client.get(
        f"/api/v1/tasks/{task['id']}",
        headers=_headers(user),
    )

    assert response.status_code == 200
    assert response.json()["id"] == task["id"]


def test_get_nonexistent_task_returns_404(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = client.get(
        "/api/v1/tasks/999999",
        headers=_headers(user),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_full_update_task(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    task = _create_task(client, user).json()

    response = client.put(
        f"/api/v1/tasks/{task['id']}",
        json={
            "title": "Updated title",
            "description": None,
            "status": "DONE",
            "priority": "HIGH",
            "due_date": None,
        },
        headers=_headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated title"
    assert body["description"] is None
    assert body["status"] == "DONE"
    assert body["priority"] == "HIGH"
    assert body["due_date"] is None
    assert body["user_id"] == user.id


def test_put_requires_all_declared_fields(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    task = _create_task(client, user).json()

    incomplete_payloads = [
        {"title": "Only title"},
        {
            "title": "No description key",
            "status": "DONE",
            "priority": "HIGH",
            "due_date": None,
        },
        {
            "title": "No due date key",
            "description": None,
            "status": "DONE",
            "priority": "HIGH",
        },
        {
            "description": None,
            "status": "DONE",
            "priority": "HIGH",
            "due_date": None,
        },
    ]

    for payload in incomplete_payloads:
        response = client.put(
            f"/api/v1/tasks/{task['id']}",
            json=payload,
            headers=_headers(user),
        )
        assert response.status_code == 422, payload


def test_update_task_status(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    task = _create_task(client, user).json()

    response = client.patch(
        f"/api/v1/tasks/{task['id']}/status",
        json={"status": "IN_PROGRESS"},
        headers=_headers(user),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_delete_task(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    task = _create_task(client, user).json()

    response = client.delete(
        f"/api/v1/tasks/{task['id']}",
        headers=_headers(user),
    )

    assert response.status_code == 204

    follow_up = client.get(
        f"/api/v1/tasks/{task['id']}",
        headers=_headers(user),
    )
    assert follow_up.status_code == 404


def test_blank_title_is_rejected(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    for title in ["", "   "]:
        response = _create_task(client, user, title=title)
        assert response.status_code == 422


def test_invalid_status_is_rejected(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = _create_task(client, user, status="INVALID")

    assert response.status_code == 422


def test_invalid_priority_is_rejected(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")

    response = _create_task(client, user, priority="URGENT")

    assert response.status_code == 422


def test_user_id_cannot_be_spoofed_on_create(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "owner@example.com")
    other = _create_user(db_session, "other@example.com")

    response = _create_task(client, user, user_id=other.id)

    assert response.status_code == 422


def test_unauthenticated_task_requests_are_rejected(
    client: TestClient,
) -> None:
    assert client.post("/api/v1/tasks", json={"title": "x"}).status_code == 401
    assert client.get("/api/v1/tasks").status_code == 401


def test_user_cannot_access_other_users_task(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    task_b = _create_task(client, user_b, title="User B task").json()

    headers_a = _headers(user_a)
    task_url = f"/api/v1/tasks/{task_b['id']}"

    assert client.get(task_url, headers=headers_a).status_code == 404
    assert (
        client.put(
            task_url,
            json=_payload(title="Hijacked"),
            headers=headers_a,
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"{task_url}/status",
            json={"status": "DONE"},
            headers=headers_a,
        ).status_code
        == 404
    )
    assert client.delete(task_url, headers=headers_a).status_code == 404

    db_session.expire_all()
    stored_task = db_session.get(Task, task_b["id"])

    assert stored_task is not None
    assert stored_task.user_id == user_b.id
    assert stored_task.title == "User B task"
    assert stored_task.status == "TODO"
    assert stored_task.priority == "MEDIUM"


def test_user_cannot_see_other_users_tasks_in_list(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    task_a = _create_task(client, user_a, title="A task").json()
    task_b = _create_task(client, user_b, title="B task").json()

    response = client.get("/api/v1/tasks", headers=_headers(user_a))

    assert response.status_code == 200
    body = response.json()
    returned_ids = [item["id"] for item in body["items"]]
    assert task_a["id"] in returned_ids
    assert task_b["id"] not in returned_ids
    assert body["total"] == 1


def test_update_cannot_transfer_ownership(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    task = _create_task(client, user_a).json()

    response = client.put(
        f"/api/v1/tasks/{task['id']}",
        json=_payload(user_id=user_b.id),
        headers=_headers(user_a),
    )

    assert response.status_code == 422

    stored = db_session.get(Task, task["id"])
    assert stored is not None
    assert stored.user_id == user_a.id


def test_deleting_user_cascades_to_tasks_at_database_level(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "cascade@example.com")
    task = _create_task(client, user).json()
    task_id = task["id"]

    db_session.execute(delete(User).where(User.id == user.id))
    db_session.commit()
    db_session.expire_all()

    remaining = db_session.scalar(select(Task).where(Task.id == task_id))
    assert remaining is None


# ---------------------------------------------------------------------------
# Phase 4: search
# ---------------------------------------------------------------------------


def test_search_exact_title(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="Báo cáo thử việc")
    _create_task(client, user, title="Other task")

    body = _list(client, user, search="Báo cáo thử việc").json()

    assert body["total"] == 1
    assert body["items"][0]["title"] == "Báo cáo thử việc"


def test_search_partial_title(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="Báo cáo thử việc")

    body = _list(client, user, search="Báo cáo").json()

    assert body["total"] == 1


def test_search_ascii_case_insensitive(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="Weekly Report")

    for term in ("weekly report", "WEEKLY REPORT", "wEeKlY"):
        body = _list(client, user, search=term).json()
        assert body["total"] == 1, term


def test_search_vietnamese_case_insensitive(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="Nộp BÁO CÁO")
    _create_task(client, user, title="Báo cáo thử việc")

    body = _list(client, user, search="báo cáo").json()

    assert body["total"] == 2


def test_search_whitespace_is_trimmed(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="Báo cáo")

    body = _list(client, user, search="  Báo cáo  ").json()

    assert body["total"] == 1


def test_empty_search_is_ignored(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="One")
    _create_task(client, user, title="Two")

    body = _list(client, user, search="   ").json()

    assert body["total"] == 2


def test_search_no_match(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="One")

    body = _list(client, user, search="does-not-exist").json()

    assert body["items"] == []
    assert body["total"] == 0
    assert body["total_pages"] == 0


def test_search_escapes_literal_percent(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="Discount 100% off")
    _create_task(client, user, title="Discount 100 percent")

    body = _list(client, user, search="100%").json()

    assert body["total"] == 1
    assert body["items"][0]["title"] == "Discount 100% off"


def test_search_escapes_literal_underscore(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="file_name report")
    _create_task(client, user, title="fileXname report")

    body = _list(client, user, search="file_name").json()

    assert body["total"] == 1
    assert body["items"][0]["title"] == "file_name report"


def test_search_escapes_escape_character(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "search@example.com")
    _create_task(client, user, title="path a/b")
    _create_task(client, user, title="path aXb")

    body = _list(client, user, search="a/b").json()

    assert body["total"] == 1
    assert body["items"][0]["title"] == "path a/b"


# ---------------------------------------------------------------------------
# Phase 4: filtering
# ---------------------------------------------------------------------------


def test_status_filter(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    for value in ("TODO", "IN_PROGRESS", "DONE"):
        _create_task(client, user, title=f"{value} task", status=value)

    for value in ("TODO", "IN_PROGRESS", "DONE"):
        body = _list(client, user, status=value).json()
        assert body["total"] == 1, value
        assert body["items"][0]["status"] == value


def test_invalid_status_filter_returns_422(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")

    assert _list(client, user, status="INVALID").status_code == 422


def test_priority_filter(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    for value in ("LOW", "MEDIUM", "HIGH"):
        _create_task(client, user, title=f"{value} task", priority=value)

    for value in ("LOW", "MEDIUM", "HIGH"):
        body = _list(client, user, priority=value).json()
        assert body["total"] == 1, value
        assert body["items"][0]["priority"] == value


def test_invalid_priority_filter_returns_422(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")

    assert _list(client, user, priority="URGENT").status_code == 422


def _seed_combined_tasks(client: TestClient, user: User) -> None:
    _create_task(
        client,
        user,
        title="alpha report",
        status="TODO",
        priority="HIGH",
    )
    _create_task(
        client,
        user,
        title="alpha report",
        status="DONE",
        priority="LOW",
    )
    _create_task(
        client,
        user,
        title="beta report",
        status="TODO",
        priority="HIGH",
    )
    _create_task(
        client,
        user,
        title="alpha note",
        status="TODO",
        priority="LOW",
    )


def test_combined_search_and_status(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    _seed_combined_tasks(client, user)

    body = _list(client, user, search="alpha", status="TODO").json()

    assert body["total"] == 2
    assert all(item["status"] == "TODO" for item in body["items"])
    assert all("alpha" in item["title"] for item in body["items"])


def test_combined_search_and_priority(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    _seed_combined_tasks(client, user)

    body = _list(client, user, search="alpha", priority="HIGH").json()

    assert body["total"] == 1
    assert body["items"][0]["title"] == "alpha report"
    assert body["items"][0]["priority"] == "HIGH"


def test_combined_status_and_priority(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    _seed_combined_tasks(client, user)

    body = _list(client, user, status="TODO", priority="HIGH").json()

    assert body["total"] == 2
    assert all(item["status"] == "TODO" for item in body["items"])
    assert all(item["priority"] == "HIGH" for item in body["items"])


def test_combined_search_status_and_priority(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    _seed_combined_tasks(client, user)

    body = _list(
        client,
        user,
        search="alpha",
        status="TODO",
        priority="HIGH",
    ).json()

    assert body["total"] == 1
    assert body["items"][0]["title"] == "alpha report"


def test_mismatched_combined_filters_return_empty(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "filter@example.com")
    _seed_combined_tasks(client, user)

    body = _list(
        client,
        user,
        search="alpha",
        status="DONE",
        priority="HIGH",
    ).json()

    assert body["items"] == []
    assert body["total"] == 0


# ---------------------------------------------------------------------------
# Phase 4: pagination
# ---------------------------------------------------------------------------


def _create_tasks(
    client: TestClient,
    user: User,
    count: int,
    title_prefix: str = "Task",
) -> list[dict]:
    created: list[dict] = []
    for index in range(count):
        created.append(
            _create_task(
                client,
                user,
                title=f"{title_prefix} {index}",
            ).json()
        )
    return created


def test_default_pagination(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")
    _create_tasks(client, user, 12)

    body = _list(client, user).json()

    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total"] == 12
    assert body["total_pages"] == 2
    assert len(body["items"]) == 10


def test_custom_pagination(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")
    _create_tasks(client, user, 12)

    body = _list(client, user, page=2, page_size=5).json()

    assert body["page"] == 2
    assert body["page_size"] == 5
    assert body["total"] == 12
    assert body["total_pages"] == 3
    assert len(body["items"]) == 5


def test_empty_account_pagination(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")

    body = _list(client, user).json()

    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total_pages"] == 0


def test_empty_filtered_result_pagination(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")
    _create_tasks(client, user, 3)

    body = _list(client, user, search="no-such-title").json()

    assert body["items"] == []
    assert body["total"] == 0
    assert body["total_pages"] == 0


def test_page_beyond_total_pages_returns_empty_items(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")
    _create_tasks(client, user, 3)

    response = _list(client, user, page=5, page_size=10)

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 3
    assert body["page"] == 5
    assert body["total_pages"] == 1


def test_invalid_page_returns_422(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")

    for value in (0, -1):
        assert _list(client, user, page=value).status_code == 422


def test_invalid_page_size_returns_422(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")

    for value in (0, 101):
        assert _list(client, user, page_size=value).status_code == 422


def test_stable_ordering_for_identical_created_at(
    client: TestClient,
    db_session: Session,
) -> None:
    user = _create_user(db_session, "page@example.com")
    created = _create_tasks(client, user, 3)
    task_ids = [item["id"] for item in created]
    fixed_time = datetime(2026, 1, 1, tzinfo=UTC)

    db_session.execute(
        update(Task)
        .where(Task.id.in_(task_ids))
        .values(created_at=fixed_time)
    )
    db_session.commit()

    body = _list(client, user).json()

    returned_ids = [item["id"] for item in body["items"]]
    assert returned_ids == sorted(task_ids, reverse=True)


# ---------------------------------------------------------------------------
# Phase 4: user isolation
# ---------------------------------------------------------------------------


def test_search_cannot_expose_other_users_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(client, user_a, title="A report")
    task_b = _create_task(client, user_b, title="B secret report").json()

    body = _list(client, user_a, search="report").json()

    assert body["total"] == 1
    assert task_b["id"] not in [item["id"] for item in body["items"]]


def test_status_filter_cannot_expose_other_users_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(client, user_a, title="A task", status="TODO")
    _create_task(client, user_b, title="B task", status="DONE")

    body = _list(client, user_a, status="DONE").json()

    assert body["items"] == []
    assert body["total"] == 0


def test_priority_filter_cannot_expose_other_users_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(client, user_a, title="A task", priority="LOW")
    _create_task(client, user_b, title="B task", priority="HIGH")

    body = _list(client, user_a, priority="HIGH").json()

    assert body["items"] == []
    assert body["total"] == 0


def test_combined_filters_cannot_expose_other_users_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_task(
        client,
        user_a,
        title="A task",
        status="TODO",
        priority="LOW",
    )
    _create_task(
        client,
        user_b,
        title="B target",
        status="DONE",
        priority="HIGH",
    )

    body = _list(
        client,
        user_a,
        search="B target",
        status="DONE",
        priority="HIGH",
    ).json()

    assert body["items"] == []
    assert body["total"] == 0


def test_total_count_includes_only_current_users_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_tasks(client, user_a, 2, title_prefix="A")
    _create_tasks(client, user_b, 50, title_prefix="B")

    body = _list(client, user_a).json()

    assert body["total"] == 2
    assert all(item["user_id"] == user_a.id for item in body["items"])


def test_pagination_cannot_traverse_other_users_tasks(
    client: TestClient,
    db_session: Session,
) -> None:
    user_a = _create_user(db_session, "a@example.com")
    user_b = _create_user(db_session, "b@example.com")
    _create_tasks(client, user_a, 2, title_prefix="A")
    _create_tasks(client, user_b, 10, title_prefix="B")

    second_page = _list(client, user_a, page=2, page_size=1).json()
    out_of_range = _list(client, user_a, page=3, page_size=1).json()

    assert second_page["total"] == 2
    assert len(second_page["items"]) == 1
    assert second_page["items"][0]["user_id"] == user_a.id
    assert out_of_range["items"] == []
    assert out_of_range["total"] == 2
