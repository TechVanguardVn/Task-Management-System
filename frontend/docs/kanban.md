# FE-07: Kanban board and task details drawer

> Historical FE-07 implementation record. Status writes now reconcile shared TanStack Query caches without reloading all columns, and FE-08 restores unexpired same-tab sessions after `/api/auth/me`. Drawer confirmations retain the selected task until mutation completion. See the [current README](../README.md).

`/kanban` uses the protected AppLayout and existing in-memory authentication lifecycle. `/kanban?projectId=UUID` also supports an initial owned project scope. No backend, Supabase or Flyway changes are involved. Stitch screenshots guide the lavender surfaces, indigo actions, three-column board and right-side drawer; their sample users, tasks and unsupported features are not runtime data.

## API and incremental loading

The deployed public OpenAPI specification and FE-06 task implementation were inspected before implementation on 2026-11-23. Every request uses the existing centralized Axios client and documented paths:

| Operation | Backend request |
| --- | --- |
| Owned project catalog | GET `/api/projects?page=N&size=100` |
| One status column | GET `/api/projects/{projectId}/tasks?status=TODO&page=N&size=20&sort=createdAt,desc` |
| Full task details | GET `/api/tasks/{taskId}` |
| Create | POST `/api/projects/{projectId}/tasks` |
| Edit or move | PUT `/api/tasks/{taskId}` |
| Change status | PATCH `/api/tasks/{taskId}/status`, body `{ "status": "DONE" }` |
| Delete | DELETE `/api/tasks/{taskId}` |

There is one selected project, never an incomplete global task aggregation. The project selector reuses FE-06's sequential metadata paging/deduplication. Unknown project IDs are rejected against that owned catalog before loading columns. The first active project is the default, falling back to an archived project when necessary. Users without projects receive guidance and a link to `/projects`.

Each of TODO, IN_PROGRESS and DONE has an independent paginated resource, initially loading at most 20 cards. Only three task-list requests are needed initially. Column headers use the API's filtered `totalElements`; the separate “Đã tải X / Y” label distinguishes loaded cards from matching totals. A deliberate “Tải thêm công việc” action fetches one subsequent page for that column, merging UUIDs without duplicates. Failure on a later page preserves earlier cards and offers retry. No background loop downloads an unbounded project collection.

Title search debounces for 350ms and is a backend case-insensitive substring match. Search and priority are passed to every status-scoped query, so partial loading does not produce misleading client-side filter results. Changing filters or project resets pagination; failed requests never become empty successes or fabricated zero counts. Reads are canceled/ignored after scope, filter, revision or session changes. Loading additional pages is single-flight.

Cards follow server order: createdAt descending, then UUID ascending. New tasks therefore appear near the top of the matching column after creation. The board is incremental, not a complete snapshot; load additional pages explicitly. Very large collections can still grow the DOM after many manual load-more actions. Offset pagination can miss or repeat items during concurrent external changes; deduplication prevents repeated cards, and “Tải lại dự án” refreshes the catalog and board. There is no polling or real-time synchronization claim.

## Dragging, pending state and errors

The current React integration from [dnd kit](https://dndkit.com/react/quickstart/) is used: `@dnd-kit/react` 0.5.3 with `@dnd-kit/dom` 0.5.3 for accessibility configuration. React 19 peer compatibility was checked. The Kanban route is lazy-loaded, keeping drag-and-drop code out of the initial bundle for other pages.

Drag handles support pointer/touch input and the library's keyboard sensor. Destination columns are highlighted. Card bodies remain available for scrolling and opening details. Keyboard users can also use the native “Chuyển sang” select on every card. Drag instructions and announcements are Vietnamese. Space/Enter lifts a handle; arrow keys move it; Space drops and Escape cancels. Focusable board overflow permits tablet/mobile horizontal navigation without page overflow.

A cross-column drop projects the task into the destination while PATCH is pending. The task's original API representation remains intact: no completion timestamp is generated. Further mutations, project/filter changes and load-more actions are disabled during that request. The shared mutation hook's request guard prevents duplicate writes, including rapid repeated input. Same-column drops and canceled/outside drops make no status request. There is no sortable/reorder state or position field, and no claim that a manual card order persists.

Success reloads all three column resources and their counts from the server. Failure removes the optimistic projection and displays a localized error with a board reload action. A network failure leaves the server outcome uncertain, so writes are never retried automatically; reload before retrying. Returning to the dashboard already reloads its resources because there is no persistent cross-route dashboard cache.

## Drawer and task mutations

Clicking a card opens a native modal dialog styled as a right-side drawer, leaving the board visible under a dimmed overlay. GET `/api/tasks/{taskId}` loads authoritative details; editing never assumes a truncated list description is complete. Drawer fields are actual title, owned project name, status, priority, date-only due date, completion timestamp, creation/update timestamps and plain-text description. Nulls show appropriate empty values. Descriptions retain line breaks and React text escaping; Markdown/HTML rendering is not invented.

The drawer traps focus, closes through its close button/Escape/overlay, locks background scrolling and restores focus. If a mutation removed the originating card, focus falls back to the board region. Editing/deletion use the existing native task dialogs on top of the drawer; their pending guards prevent accidental dismissal or duplicate submissions.

PUT sends the complete supported task representation, preserving untouched description, status, priority and dates. Moving is allowed only between two active owned projects. After save the drawer refetches GET details, the board refreshes, and a move selects the destination project while retaining the drawer. Successful deletion requires confirmation, closes the drawer, reloads columns/counts and displays feedback. Column plus buttons preselect the current project and that column's status; the main create action defaults to TODO. Successful creation clears board filters so the new task is not hidden by them.

Archived projects remain readable but every write is disabled: drag handles, status selectors, create, edit and delete. A concurrent archive still returns a localized backend conflict and rolls back the projection. No unarchive flow is added. The backend remains authoritative for ownership and archived rules; no owner/user IDs are submitted. 401 reuses the existing session clearing/login redirect; 403/404/errors expose no raw diagnostics or foreign-owner information. A failed detail read exposes no edit/delete controls.

Due dates are formatted as Vietnamese calendar dates, with no invented due time. Local calendar comparisons reuse FE-06's upcoming/overdue logic; DONE tasks are never overdue. Completion timestamps are displayed only from backend responses. Cards omit avatars, fake codes, sprints, teams, tags, comments, attachments and checklist statistics.

## Files delivered

Created:

- `src/components/kanban/KanbanWorkspace.jsx`
- `src/components/kanban/KanbanColumn.jsx`
- `src/components/kanban/KanbanCard.jsx`
- `src/components/kanban/TaskDrawer.jsx`
- `src/components/kanban/kanbanModel.js`
- `src/components/kanban/kanban.css`
- `src/hooks/useKanbanColumn.js`
- `tests/kanban.test.js`
- `docs/kanban.md`

Modified:

- `src/api/taskRequests.js`: shared full-task GET.
- `src/components/tasks/TaskEditor.jsx`: optional initial create status; existing edit values preserved.
- `src/pages/KanbanPage.jsx`: replaces the placeholder with the board.
- `src/routes/AppRoutes.jsx`: lazy Kanban route and Vietnamese loading fallback.
- `package.json`, `package-lock.json`: dnd kit dependencies.
- `README.md`: FE-07 entry and documentation link.

## Scope limits

Persistent manual ordering, a global cross-project board, bulk operations, teams/assignees, sprint controls, tags, comments, attachments, file uploads, fake counters and real-time synchronization are intentionally omitted. The backend has no task position field or corresponding unsupported-feature endpoints. No deployment or push is part of FE-07.

## Verification

Executed locally on Windows with Node 22.17.0:

- `npm run lint`: passed.
- `npm test`: **93 passed**, zero failures/skips. Seven new tests cover bounded server column queries, later pages, UUID deduplication, stable ordering, optimistic projection/rollback without fabricated timestamps, invalid/no-op/locked moves, full-detail GET cancellation/error propagation and null timestamps.
- `npm run build`: passed. Kanban is split into a separate route chunk; no oversized-chunk warning remains.
- Headless Edge against the built Vite preview: initial request deduplication, accurate loaded/total counts beyond one page, failed load-more preservation/retry, pointer and keyboard drag/drop, same-column no-op, pending locks, persisted fixture status after refetch, failed-PATCH rollback and the native status-selector alternative passed.
- Drawer GET/full-description loading, focus trap/restoration, Escape/overlay close, complete PUT preservation, moving between projects while keeping the drawer consistent, cancel/confirm deletion, main/column create defaults, required/backend field validation, archived read-only controls, combined server search/priority filters, empty columns, unknown-project isolation, no-project guidance, independent column failures/retry/skeletons, detail 404/retry and expired-session redirects passed.
- Responsive checks at 375/768/1024/1440px passed with no page-level horizontal overflow or application browser errors. Mobile drawer width and scroll locking were checked; desktop/mobile screenshots were visually reviewed.
- The existing FE-06 browser smoke check also passed after extending the shared task editor, including CRUD, nullable/full PUT fields, filters, pagination, archived restrictions, responsive dialogs and session handling.

Browser fixtures/tooling are temporary ignored development artifacts, not runtime mock data or new project dependencies. All browser traffic outside the local preview was intercepted, including authentication and every mutation. These are frontend contract/behavior checks; they do not establish live CORS, database trigger behavior or production authorization. Only the public OpenAPI document was fetched from the deployed backend. No real account/task/project was created, changed or deleted, and no database connection, deployment or push occurred. Authenticated staging smoke checks remain separate.
