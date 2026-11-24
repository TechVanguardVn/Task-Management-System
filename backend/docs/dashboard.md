# Task 6: dashboard and statistics

All three GET endpoints require an active session-backed bearer JWT. Optional `projectId` must identify a project owned by that user; foreign and missing project IDs both return 404. Invalid UUIDs return 400 and missing/invalid authentication returns 401.

## Summary

`GET /api/dashboard/summary?projectId=UUID`

```json
{
  "totalTasks": 3,
  "todoTasks": 1,
  "inProgressTasks": 1,
  "doneTasks": 1,
  "completionPercentage": 33.33
}
```

Counts include all owned tasks, including tasks without due dates and tasks in archived projects. Completion percentage is `DONE / total * 100`, rounded HALF_UP to two decimal places. A user/project with no tasks returns all zero counts and percentage 0.00.

A single PostgreSQL aggregation query counts all four totals with COUNT/FILTER and an explicit owner condition. No task entities are loaded or counted in application memory; Java computes only the ratio from the aggregate totals. An optional project filter is validated by an owner-scoped existence query before aggregation. Native SQL still runs within the transaction's forced RLS context.

## Upcoming and overdue

```text
GET /api/dashboard/upcoming?projectId=UUID&page=0&size=10
GET /api/dashboard/overdue?projectId=UUID&page=0&size=10
```

Both reuse the task DTO and pagination structure from `tasks.md`: content, page, size, totalElements, totalPages. Page is zero-based and nonnegative; size defaults to 10 and must be 1–100. An empty result or a page beyond the end returns an empty content array with actual totals.

- Upcoming includes due dates from today through today + 7 days, inclusive. For today 2026-11-23, this is 2026-11-23 through 2026-11-30. It includes tasks due today.
- Overdue includes due dates strictly before today. Tasks due today are not overdue.
- Both exclude DONE tasks and tasks with null dueDate.
- Both include archived-project tasks, consistent with existing read access; archived projects are not silently removed from statistics.
- Ordering is dueDate ascending, then UUID ascending. This fixed tie-breaker makes unchanged data deterministic across pages. Concurrent changes can shift offset-based pages.

Today is computed once per request using an injected Clock. `DASHBOARD_TIME_ZONE` defaults to UTC and can be set to an IANA zone such as `Asia/Ho_Chi_Minh`. It affects date boundaries only, not UTC authentication/session timestamps. Server OS timezone and PostgreSQL CURRENT_DATE are not used for the window. An invalid zone fails startup rather than silently changing date behavior.

Every service call starts a read-only transaction, establishes transaction-local RLS identity from the verified principal, and constrains queries by owner even without projectId. Project ownership never comes from request ownerId/userId fields. The optional project condition narrows this scope rather than replacing it.

Date filtering, ordering, pagination and counts execute in SQL. The existing project/due-date and project/status indexes support these queries. Task results use the existing to-one entity graph and DTO mapper to avoid per-task project/owner queries. No new tables, migrations, dependencies, dashboard writes or task-trigger changes are introduced.

## Verification

Run `./mvnw compile test` for unit checks and automatic Testcontainers integration when Docker is available, or `./scripts/Test-Postgres.ps1` on Windows for the isolated local PostgreSQL fallback. See `api-documentation-and-tests.md` for current test selection and safety checks. Integration tests freeze the dashboard clock independently of the real JWT clock, and cover zero tasks, status totals, percentage rounding, ownership, project filters, today/day-seven/day-eight boundaries, overdue/null/DONE exclusions, archived tasks, deterministic UUID ordering, pagination and invalid inputs. A statistics assertion verifies summary executes one JPA SQL statement and loads zero entities when no project filter is supplied.

Verified with Java 21 and isolated PostgreSQL 18.7: compilation and all 58 tests passed without failures/skips, including seven new dashboard integration tests. Flyway/Hibernate checks passed, the temporary server stopped successfully, and production Supabase was not contacted.

Reference: [PostgreSQL aggregate functions](https://www.postgresql.org/docs/18/functions-aggregate.html).
