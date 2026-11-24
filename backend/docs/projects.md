# Task 4: project APIs

All endpoints require an active session-backed JWT in `Authorization: Bearer <token>`.

| Endpoint | Success | Behavior |
| --- | --- | --- |
| `POST /api/projects` | 201 + Location | Creates a project owned by the authenticated user. |
| `GET /api/projects?page=0&size=20` | 200 | Lists only that user's projects, including archived projects. |
| `GET /api/projects/{id}` | 200 | Returns one owned project. |
| `PUT /api/projects/{id}` | 200 | Replaces all editable fields of one owned project. |
| `DELETE /api/projects/{id}` | 204 | Permanently deletes the project and its tasks. |
| `PATCH /api/projects/{id}/archive` | 200 | Sets status to ARCHIVED and returns the project; repeat calls are safe. |

Create and PUT accept:

```json
{
  "name": "Release planning",
  "description": "Plan the next release",
  "color": "#2563eb",
  "status": "ACTIVE",
  "startDate": "2026-11-01",
  "dueDate": "2026-11-30"
}
```

Name is required, stripped, nonblank, and limited to 120 characters. Optional description is limited to 10,000 characters; optional color to 32 characters. No particular color syntax is imposed by the existing schema. Status accepts ACTIVE or ARCHIVED, defaulting to ACTIVE when omitted/null. Dates are optional ISO dates; when both exist, dueDate must be on or after startDate. Requests also accept `start_date`/`due_date`; responses use camelCase.

PUT is full replacement: omitted description/color/dates become null, and omitted/null status becomes ACTIVE. Supply the existing status to preserve it. An owner may restore an archived project via PUT with ACTIVE, or create an already archived project. Archive changes only status. Archived projects remain readable/editable/deletable by their owner; their task inserts/updates and moves into/out of them are rejected by the existing database trigger. Task 5 adds task endpoints documented in `tasks.md`; direct task DELETE is also blocked while archived, while deleting the project still cascades its tasks.

Responses contain `id`, `ownerId`, the six editable fields, `createdAt`, and `updatedAt`. DTOs contain no nested entities or credentials. Owner cannot be changed through these APIs: owner_id/ownerId in requests are ignored under the current JSON configuration and never copied into an entity. The service derives the owner solely from the verified principal. Database-generated timestamps remain authoritative.

## Pagination

Page is zero-based, defaults to 0, and must be nonnegative. Size defaults to 20 and must be 1–100. Ordering is createdAt descending, then UUID descending to break ties. The response shape is:

```json
{"content": [], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0}
```

Pages beyond the end return an empty array with actual totals. Ordering is deterministic for unchanged data; concurrent inserts/deletes can shift offset-based pages.

## Ownership, deletion and errors

Each service operation starts a transaction, sets transaction-local RLS identity from `AuthPrincipal`, and uses owner-scoped repository queries. It does not reuse the filter's earlier transaction. PUT, archive and delete lock the owned project row before mutation to serialize overlapping edits and cooperate with existing task/archive locks. No migration or new privileges are required.

Unauthenticated/invalid/revoked tokens return 401. Foreign-owned and missing IDs both return 404 (`Project not found`) to avoid disclosing resource existence. Invalid fields, ranges, UUIDs, enums or pagination return 400. Database integrity/concurrency conflicts return the standard error response with 409 and no SQL details. Other unimplemented business routes remain denied.

Deletion atomically uses the existing `tasks.project_id ON DELETE CASCADE` constraint. All tasks in that project, including completed tasks and tasks in archived projects, are permanently deleted. Users, sessions and unrelated projects/tasks remain. Repeating DELETE returns 404. Archive retains all data and is the non-deleting alternative.

## Verification

`./mvnw compile test` runs unit checks and prefers Testcontainers for integration tests when Docker is available; otherwise database suites skip unless the isolated local runner supplies its override. See `api-documentation-and-tests.md`. On Windows, `./scripts/Test-Postgres.ps1` creates an isolated loopback PostgreSQL cluster, runs all integration tests, and stops its server. No production credentials or Supabase connection are used.

Verified with Java 21 and PostgreSQL 18.7: compilation and all 42 tests passed without failures or skips, including eight new project integration tests. Coverage includes all six anonymous requests, forged ownership fields, cross-user operations, missing IDs, pagination, replacement/restore semantics, invalid inputs, idempotent archive with database task-write rejection, and cascade deletion preserving unrelated tasks. Existing authentication/database tests remain included.

Validation follows [Spring MVC request and method validation](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-validation.html).
