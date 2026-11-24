# FE-06: Task management

> Historical FE-06 implementation record. `/tasks` now defaults to All Projects, with complete per-project aggregation and shared query caching; individual project mode remains supported. See the [current README](../README.md) for aggregation, authentication persistence and final verification.

`/tasks` implements “Công việc của tôi” inside the existing protected AppLayout. `/projects/:projectId/tasks` uses the same workspace with an initial project scope; `/tasks?projectId=UUID` also supports project links. Login, registration, the dashboard and project CRUD are unchanged. Task details now link back to their project's task list.

## Scope and API contract

The deployed public OpenAPI specification and backend TaskService/TaskRequest were inspected on 2026-11-23. Runtime records always come from the centralized authenticated Axios client. There is no global GET `/api/tasks`. The selector is the primary scope, with an explicit explanation that the list and statistics belong only to that project.

Owned project metadata is read sequentially in pages of 100 through GET `/api/projects`, with cancellation and deduplication. This avoids silently omitting projects beyond the first page and never fetches every project's tasks. The first active project is the default, falling back to an archived project when needed. An unknown/foreign project ID is not used to fetch tasks. Large project catalogs require multiple metadata requests; a future searchable project-selector API would improve this. Concurrent project changes during metadata pagination can affect the catalog until it is reloaded.

| Operation | Existing backend endpoint |
| --- | --- |
| List, search, filter, sort and paginate | GET `/api/projects/{projectId}/tasks` |
| Create | POST `/api/projects/{projectId}/tasks` |
| Edit or move | PUT `/api/tasks/{taskId}` |
| Quick status change | PATCH `/api/tasks/{taskId}/status` |
| Delete | DELETE `/api/tasks/{taskId}` |
| Project-wide status counts | GET `/api/dashboard/summary?projectId=UUID` |
| Project-wide overdue count | GET `/api/dashboard/overdue?projectId=UUID&page=0&size=1` |

The overdue card uses `totalElements`, not the length of that one-item page. Summary counts do not change with search/status/priority filters; this is stated next to the cards. Missing or failed reads never become fabricated zero counts. Statistics requests do not run for each filter change.

## Search, filters and pagination

Title search is a server-side case-insensitive substring match (`search`, maximum 255 characters); the backend escapes literal SQL wildcard characters. The input debounces for 350ms, supports clearing and resets to page zero. Status (`TODO`, `IN_PROGRESS`, `DONE`) and priority (`LOW`, `MEDIUM`, `HIGH`) filters combine with search. Changing scope resets list controls.

Page size defaults to 10, with 20/50/100 options; 100 is the backend maximum. Sorting sends the documented single `field,direction` value. The UI offers dueDate ascending/descending, createdAt ascending/descending, title ascending and priority descending. The backend adds an ID tie-breaker. There is no client-side aggregation pretending to offer global sorting or pagination.

The footer uses actual API totals and total pages. Deleting the last item on a noninitial page moves back one page. If external changes leave a page empty, it offers a return to page zero. Empty results and failed requests provide reset/retry controls. In-flight reads are canceled and stale responses cannot replace a newer scope/query/session.

## Mutations, validation and ownership

Create/edit use native modal dialogs with labels, field errors, focus trapping/restoration, Escape handling and disabled duplicate submissions. Required title is trimmed and limited to 255 characters; optional description to 10,000. Project ownership/active status, actual enum values and calendar dates are checked locally, with localized backend field errors. Requests send only `projectId`, `title`, `description`, `status`, `priority`, `dueDate`. No owner/user ID, completion timestamp or task code is invented.

PUT preserves every supported existing field. Optional values are explicit nulls when intentionally cleared. Moving is allowed only between owned active projects; the destination scope opens after success. Archived source and destination projects are blocked in the editor. Every archived-project write control, including deletion, is disabled because the backend rejects all those operations. Concurrent archiving is still enforced by the backend and displayed as a 409 with a reload instruction. Frontend restrictions are convenience, not authorization.

Deletion requires explicit confirmation. Successful mutations refresh the list and both summary resources and display success feedback. Creating clears filters and returns to page zero; other edits preserve filters, so an edited task can legitimately leave the current filtered results. There is no automatic mutation retry: a network failure does not establish that the write failed on the server. Reload before retrying uncertain writes. The API does not provide optimistic version/ETag concurrency controls.

The existing in-memory bearer token and session lifecycle handle authentication. A matching 401 clears the session and redirects to login; 403/404 and mutation failures display safe Vietnamese messages without raw diagnostics. No production test accounts, tokens or mock task records are included in source. Backend ownership queries/RLS remain responsible for rejecting foreign resources.

## Dates and presentation

The desktop table shows title, real project name, status, priority, due date and actions. On mobile, the same semantic table becomes labeled task cards; tablet tables scroll within their own container. Long titles wrap. Completed tasks retain readable contrast. There are no bulk-selection checkboxes, fake UUID-derived task codes, assignees or decorative action controls.

Due dates use local calendar days, without interpreting a date-only string as UTC midnight. An unfinished task before today is overdue; today through the seventh following calendar day is upcoming. DONE and undated tasks are never marked overdue. Row labels update every minute. The overdue aggregate follows the backend's configured dashboard time zone, which can differ from the viewer's calendar near midnight; the page explains this distinction. `completedAt` is displayed only when returned by the server; PATCH/PUT/POST never generate or send it.

## Verification

Executed locally with Node 22.17.0:

- `npm run lint`: passed.
- `npm test`: **86 tests passed**, zero failures/skips. Eleven new tests cover exact scoped endpoints/query parameters, all metadata pages/cancellation, aggregate requests, complete PUT preservation, nullable clearing, allowed/forbidden moves, validation and calendar boundaries.
- `npm run build`: passed.
- Headless Edge against the built Vite preview: CRUD, complete edit payloads, moves, server-returned completion timestamps, completion/reopening, cancel/confirm deletion, last-page deletion, combined search/filters, sorting, page sizes/navigation, archived locks, validation/409/404 failures, 403/network retries, skeleton/empty/no-results states, unknown-project isolation, no-project guidance, project/detail links and 401 redirects passed.
- Responsive and modal focus/Escape checks passed at 375, 768, 1024 and 1440px with no page-level horizontal overflow, unexpected requests or browser application errors. Desktop and mobile screenshots were visually reviewed. Temporary browser tooling/fixtures/screenshots are ignored, not runtime dependencies.

All browser backend traffic was intercepted with isolated test fixtures. These checks validate frontend requests and behavior, not live backend CORS, database triggers or production authorization. No production authentication or write requests, Supabase changes, backend changes, migration edits, push or deployment occurred. A real authenticated staging smoke check remains separate.

## Intentionally omitted

Cross-project task aggregation/global pagination, CSV export, bulk deletion, team/assignee/sprint/comments/attachments/labels, fictional statistics and demo-state controls are omitted. Kanban drag and drop belongs to FE-07. No backend endpoints were added or changed.

## Files delivered

Created:

- `src/api/taskRequests.js`, `src/api/tasks.js`
- `src/components/tasks/TaskWorkspace.jsx`, `TaskTable.jsx`, `TaskEditor.jsx`, `TaskDeleteDialog.jsx`, `taskModel.js`, `tasks.css`
- `src/hooks/useTaskMutation.js`
- `tests/tasks.test.js`
- `docs/tasks.md`

Modified:

- `src/pages/TasksPage.jsx`
- `src/pages/ProjectTasksPage.jsx`
- `src/pages/TaskDetailsPage.jsx`
- `README.md`
