# FE-04: Dashboard with real API data

> Historical FE-04 implementation record. Management pages are now implemented, reads use the shared TanStack Query cache and FE-08 supports verified same-tab reload restoration. See the [current README](../README.md) for the final behavior and test/deployment status.

The live OpenAPI specification and repository DTOs/controllers were inspected before implementation. All business values rendered by the application come from the configured backend through the shared bearer-authenticated Axios client. There are no demo records or fallback statistics in application source.

## API mapping

| Request | Mapping |
| --- | --- |
| `GET /api/dashboard/summary` | `totalTasks`, `todoTasks`, `inProgressTasks`, `doneTasks`, `completionPercentage` |
| `GET /api/dashboard/upcoming?page=0&size=4` | `PageResponse<TaskResponse>`: `content`, `page`, `size`, `totalElements`, `totalPages` |
| `GET /api/dashboard/overdue?page=0&size=4` | The same task page envelope |
| `GET /api/projects?page=0&size=4` | Four newest-created projects, using the backend's createdAt/id descending order |
| `GET /api/tasks/{taskId}` | Read-only detail route `/tasks/:taskId`, so deadline links open the selected task |

Deadline lists paginate independently; changing one page does not reload summary/projects/the other list. Counts and page envelopes are validated rather than silently replaced with zeros. The dashboard presents project names when the returned recent-project page includes the matching ID; otherwise it displays a shortened version of the actual project ID. It does not fetch every project or make per-row requests. Recent projects display actual name/status and optional due date, without inferred progress or team information.

The backend's upcoming window includes today through today+7 days, inclusive, using `DASHBOARD_TIME_ZONE`; overdue is strictly before its today. Both exclude DONE and undated tasks, ordered by dueDate/id ascending. The frontend uses those classifications as returned. Due dates are calendar dates and are formatted locally without parsing them as UTC instants. Greeting/today text follows the browser's local clock, refreshed every minute; the backend's deadline boundary can differ if its configured time zone differs.

## Visualizations and actions

Four summary cards map directly to the four count fields. Completion progress uses the exact backend `completionPercentage`, formatted to at most two decimals. The accessible SVG donut calculates each supported status's fraction of `totalTasks`, with a text legend and accessible description. There are exactly three states: TODO, IN_PROGRESS, DONE. Percentage labels are individually rounded, so their displayed sum can differ slightly from 100%. Zero tasks produce explicit empty text without dividing by zero. Native SVG is sufficient for this small static chart; no chart dependency is needed.

Historical daily counts and project task-progress totals are not available in the inspected API. The weekly chart is replaced with current completion progress; project progress bars are omitted. No monthly growth, sprint, SLA, blocked state, team counts or promotional banner is shown.

Task links open protected read-only details using the documented task endpoint. “Xem tất cả công việc” navigates to `/tasks`; “Xem dự án” navigates to `/projects`. Those management pages remain placeholders from earlier tasks. There is no existing project/task creation flow, so creation buttons are omitted rather than opening a nonfunctional modal. No CRUD writes were added.

## Loading, errors and isolation

Independent resource hooks start the four dashboard reads concurrently. Each section has its own loading/error/empty state and retry action; partial failures preserve successfully loaded sections. “Làm mới” refreshes the four resources. An empty page after concurrent changes offers a return to page zero. Loading/error states never invent zero totals. Retry errors show Vietnamese messages without server diagnostics.

Resources are scoped to the current in-memory token and query parameters. AbortControllers and response guards prevent stale updates after navigation, query changes or session changes. One deferred microtask suppresses the throwaway request during React StrictMode's effect replay. There is no cross-user response cache. Existing Axios 401 handling and ProtectedLayout redirect expired/invalid sessions to login.

## Verification

Executed locally: `npm run lint`, all **65** unit tests, and `npm run build` passed. New unit tests cover endpoint/parameter contracts, summary integrity, zero tasks, missing data, API failures, percentages, supported statuses, date-only formatting, greeting boundaries, loading/error transitions and aborted/stale requests.

Temporary headless Edge checks covered loading without fake zero values, populated/empty dashboards, full and partial API failures, retry, expired credentials, bearer headers, one initial request per endpoint under StrictMode, pagination isolation, task links/details, and 375/768/1024/1440px layouts without horizontal overflow. A browser time zone west of UTC verified that date-only deadlines do not shift to the previous day. No React errors occurred.

All browser API responses used isolated test-runner fixtures; no production authentication or business-data requests were sent. Real-credential Render CORS/end-to-end behavior remains unverified. No backend, migrations, dependencies, deployment or Git push was changed.

## Changed files

- Added `src/api/dashboard.js` and `dashboardRequests.js`.
- Added `src/hooks/useApiResource.js` and `readResource.js`.
- Added `src/components/dashboard/`: summary cards, completion overview, status donut, deadline lists, recent projects, resource states, presentation helpers and scoped CSS.
- Replaced the dashboard placeholder in `src/pages/DashboardPage.jsx`.
- Added `src/pages/TaskDetailsPage.jsx` and its protected route in `src/routes/AppRoutes.jsx`.
- Extended `src/components/Icon.jsx` with dashboard icons.
- Added `tests/dashboard.test.js`; updated the frontend README and added this document.
