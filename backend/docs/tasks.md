# Task 5: task APIs

All endpoints require a session-backed bearer JWT. Task ownership is derived through the owning project; request userId/ownerId fields are never used.

| Endpoint | Success | Behavior |
| --- | --- | --- |
| `POST /api/projects/{projectId}/tasks` | 201 + Location | Creates a task in an owned, active project. |
| `GET /api/projects/{projectId}/tasks` | 200 | Searches/filters/pages tasks in one owned project. |
| `GET /api/tasks/{taskId}` | 200 | Returns one owned task. |
| `PUT /api/tasks/{taskId}` | 200 | Replaces editable task fields; can move to another owned, active project. |
| `PATCH /api/tasks/{taskId}/status` | 200 | Changes only status. |
| `DELETE /api/tasks/{taskId}` | 204 | Permanently deletes a task in an active project. |

Create and PUT request:

```json
{
  "title": "Prepare release",
  "description": "Review the checklist",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-12-01"
}
```

Title is required, stripped, nonblank, and limited to 255 characters. Description is optional, at most 10,000 characters. Status accepts TODO/IN_PROGRESS/DONE and defaults to TODO when omitted/null. Priority accepts LOW/MEDIUM/HIGH and defaults to MEDIUM. dueDate is an optional ISO date; past dates and dates outside the project's date range remain allowed by the original schema.

On create, the URL determines the project. If an optional projectId body field is supplied it must match the URL, otherwise 400. PUT may supply projectId to move the task; omitting/null keeps its current project. Both source and destination must be owned and active. PUT is replacement: omitted description/dueDate are cleared and omitted status/priority reset to their defaults. Status-only updates should use PATCH with `{"status":"DONE"}`.

Responses contain id, title, description, status, priority, dueDate, completedAt, projectId, createdAt and updatedAt. They are DTOs without nested entities or credentials. completedAt, createdAt and updatedAt are read-only; supplied values are ignored. The existing database trigger sets completedAt when entering DONE, preserves it while remaining DONE, and clears it on reopening. Hibernate reads the generated values after flush; no Java timestamp callback duplicates the trigger.

## Search, filters, pagination and sorting

Example for one Kanban column:

```text
GET /api/projects/{projectId}/tasks?status=IN_PROGRESS&priority=HIGH&search=release&page=0&size=10&sort=dueDate,asc
```

- `search`: optional, at most 255 characters; stripped, case-insensitive substring match on title. Blank means no search. Percent, underscore and backslash are literal characters, not wildcards.
- `status` and `priority`: optional exact enum values, combined with search using AND. Enum values are case-sensitive.
- `page`: zero-based, default 0, nonnegative. `size`: default 10, range 1–100.
- `sort`: one `field,asc|desc` pair; default `createdAt,desc`. Allowed fields: id, title, status, priority, dueDate, completedAt, createdAt, updatedAt. An ascending UUID tie-breaker is appended unless sorting by id. PostgreSQL's native enum/null ordering applies. No client-supplied property paths or SQL expressions are accepted.

Response structure matches project pagination: `content`, `page`, `size`, `totalElements`, `totalPages`. An owned empty project or a page beyond the end returns an empty array; a missing/foreign project returns 404. Each Kanban column can request its own status-filtered page and total. Offset pages may shift during concurrent writes; no drag-and-drop rank field or bulk endpoint is introduced.

Queries always constrain both project and owner. Existing project/status, project/priority and project/dueDate indexes support common filtered access. The existing prefix-search index does not accelerate arbitrary substring searches; contains search is bounded by project but can scan its tasks. A trigram index would require a separately reviewed extension/migration if production scale warrants it. No index/extension is installed in this task.

List/detail queries fetch the to-one project relationship without collection fetches, and DTO mapping uses no lazy owner traversal. Pagination/counting stay in SQL. A Hibernate statistics integration test verifies that a full ten-task page needs at most three JPA statements (project check, task page, count), preventing an N+1 query regression.

## Ownership, archive behavior and concurrency

Every service method starts a transaction and establishes RLS identity from the verified principal. Task detail/mutation queries are owner-scoped through the project; lists and nested creates also check project ownership. Foreign and missing resources both return 404, anonymous/invalid sessions 401, invalid inputs 400, and archive/concurrency conflicts 409 using the standard API error DTO.

Writes lock parent projects before the task. Moves lock parents in PostgreSQL UUID order (canonical UUID strings, not Java's signed UUID ordering). A scalar owner-scoped query first locates the current parent without loading a stale task entity; after locking, the task is re-read and a concurrent parent change causes 409. Locks stay in the transaction through flush/commit. This cooperates with the existing database task guard and project archive locks; arbitrary external/bulk transactions can still need bounded whole-transaction retries.

Task creation, PUT, status PATCH, moves and direct DELETE are rejected while the source/destination project is archived, even for no-op status updates. The service's locked archive check covers DELETE, which the original trigger does not prohibit, and avoids relying on a dirty Hibernate update to trigger validation. Existing database guards remain unchanged for inserts/updates. Archived project/task reads are allowed. Deleting a project still cascades its tasks under the established project API contract, including an archived project's tasks.

## Verification

Run `./mvnw compile test` for unit checks and automatic Testcontainers integration when Docker is available (see `api-documentation-and-tests.md`). On Windows, `./scripts/Test-Postgres.ps1` runs the full suite against an isolated loopback PostgreSQL database, then stops its server. Production Supabase credentials/databases are not used.

Verified with Java 21 and isolated PostgreSQL 18.7: compilation and all 51 tests passed without failures or skips, including nine new task integration tests. The temporary server stopped successfully. No production database was contacted.

Integration tests cover CRUD, defaults/forged fields, timestamp transitions on create/PUT/PATCH, combined search/filters and escaped literals, pagination/sorting/query counts, IDOR across all six endpoints, project moves, archived write/delete rejection, and invalid/missing resources. Existing auth/project/database suites remain included.

Filtering uses [Spring Data JPA specifications](https://docs.spring.io/spring-data/jpa/reference/3.5/api/java/org/springframework/data/jpa/repository/JpaSpecificationExecutor.html).
