# Task Management System frontend

TaskFlow is a JavaScript React/Vite application with Tailwind CSS, React Router, Axios, TanStack Query, Sonner and dnd-kit. It includes Vietnamese authentication, a protected responsive workspace, a real-API dashboard, project/task management, an All Projects task list and a Kanban board with optimistic status changes and an editable task drawer. FE-08 adds same-tab reload restoration and full-stack integration verification; production deployment remains pending authorization/access. See the [root README](../README.md) for current deployment status and instructions. Later historical verification sections describe the state at each earlier milestone.

## Local setup

Use Node 22.17.0 (`.nvmrc`), or a version satisfying `package.json` engines, and npm. From the repository root in Windows PowerShell:

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open http://localhost:5173. The fixed port helps keep the backend's exact-origin CORS configuration predictable. Restart Vite after changing environment files.

```text
VITE_API_BASE_URL=https://task-management-system-i7xu.onrender.com
```

This is the backend origin, without `/api` or a trailing path. HTTPS is required except on loopback HTTP origins for local backend development. Invalid/missing configuration fails dev startup and production builds. All `VITE_*` values are public build-time values: never add database credentials, JWT signing secrets or access tokens to them. Local environment files are ignored by Git.

## Structure

```text
src/
  api/          Axios client, environment validation, tab-scoped token store
  assets/       Shared brand mark and future design assets
  components/   Shared presentation and error boundary
  contexts/     Authentication state provider
  hooks/        Authentication access and document titles
  layouts/      Workspace and authentication shells
  pages/        Dashboard, projects, tasks, Kanban, auth, details and 404
  query/        Session-scoped cache keys, client and mutation reconciliation
  routes/       Route definitions
```

Routes: `/login`, `/register`, `/dashboard`, `/projects`, `/tasks`, `/tasks/:taskId`, `/kanban`. `/` redirects to `/dashboard`; unknown paths show 404 inside the protected shell. Workspace routes require an authenticated user and redirect to `/login` otherwise. The dashboard reads real summary/deadline/project data and task links open a read-only detail page. Backend authorization remains required for every protected API request. See [FE-03 application layout](docs/application-layout.md) and [FE-04 dashboard](docs/dashboard.md).

Project cards now open `/projects/:projectId/tasks`. Project search/status filtering/date sorting apply only to the loaded API page and are explicitly labeled. Project CRUD/archiving use real API endpoints with full PUT payloads and confirmation dialogs. See [FE-05 project management](docs/projects.md) for supported behavior, limitations and verification.

`/tasks` defaults to All Projects; `/projects/:projectId/tasks` selects one owned project. There is no global backend task-list endpoint: the frontend retrieves complete project-scoped pages with limited concurrency and applies combined filtering/sorting/pagination locally. A fresh complete project snapshot can also serve individual pages; otherwise the individual-project API handles filtering/pagination. See the All Projects section below and [FE-06 task management](docs/tasks.md) for the original contracts and archive restrictions.

`/kanban` shows one owned project in three status columns, with server-side title/priority filtering, accurate filtered totals and explicit per-column loading of 20 tasks at a time. Cards open a right-side details drawer; create/edit/delete reuse the existing task dialogs. Dragging persists status through the backend, with pending/rollback behavior and a keyboard-accessible status selector. See [FE-07 Kanban and task drawer](docs/kanban.md) for loading limits, ordering, accessibility and verification.

## API and token handling

The live [OpenAPI specification](https://task-management-system-i7xu.onrender.com/v3/api-docs) was inspected on 2026-11-23. It describes 20 operations and the `bearerAuth` HTTP bearer scheme. Register/login return `accessToken`, `tokenType`, `expiresAt` and `user`. Tokens require an active backend session. Logout revokes that session; there is no refresh-token endpoint.

Existing authentication paths are `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` and `GET /api/auth/me`. The frontend uses all four for the authentication lifecycle. Task listing is project-scoped at `GET /api/projects/{projectId}/tasks`; `/tasks` and `/kanban` are frontend routes, not new backend endpoints. Consult the actual specification again when adding further integrations.

Future API modules should import `apiClient` from `src/api/client.js` and use relative paths beginning with `/api/`. The client supplies JSON accept headers, a 15-second timeout and the current bearer token. It rejects absolute URLs and base-URL overrides to keep tokens on the configured backend. Errors remain Axios errors, preserving the backend response/status for later form and notification handling. Do not log Axios errors/config objects because they can contain authorization headers.

`useAuth()` exposes current `user`, lifecycle `status`, `completeAuthentication`, `logout`, `retryUser` and the existing token helpers. Successful registration/login stores the returned access token and user, then navigates to `/dashboard`. A token without user data triggers one deduplicated `/api/auth/me` request. Token presence alone does not expose protected content. Never decode an unverified JWT to authorize access.

The token and its server-provided expiration are stored in memory and same-tab `sessionStorage`, scoped to the configured API origin. Reload restores only an unexpired record and verifies `/api/auth/me` before protected content; no user or query cache is persisted. Missing/malformed/expired records are removed, and denied storage falls back to memory-only login. A 401 clears the matching token, storage, user and query caches; stale failures cannot clear a newer session. Expiry also clears the session. A 403/network error preserves it. There is no refresh endpoint or automatic extension. Logout revokes on the server before clearing locally; failed revocation stays retryable. JavaScript-readable bearer storage is exposed to XSS; it is not an HttpOnly refresh-cookie design. Closing/duplicating tabs follows browser sessionStorage behavior, and cross-tab automatic logout is not implemented.

## Checks

Global operation notifications use Sonner through `src/lib/notify.js`. Login/register/logout, project mutations, task list mutations and Kanban share one application-root Toaster. Field validation, destructive confirmations and persistent recovery/GET error states remain inline. See [toast notifications](docs/notifications.md) for usage, expiry deduplication, modal support, loading cleanup and verification.

```powershell
npm run lint
npm test
npm run build
npm run preview
```

Unit tests use Node's built-in runner and Axios adapters, covering configuration validation, token lifecycle, authorization headers, 401/403 behavior, stale responses and request origin restrictions. They make no network or database requests. `npm run build` produces `dist/`. Use `npm ci` for reproducible installs from the committed lockfile.

## Google Stitch integration

Replace the corresponding `pages/` content and share repeated controls in `components/`. Keep routing in `routes/`, application shells in `layouts/` and HTTP calls in `api/`. Tailwind v4 uses `@tailwindcss/vite` and `@import "tailwindcss"` in `src/index.css`; add design tokens to its `@theme` block. Do not paste CDN scripts, duplicate HTML roots or Stitch-generated token storage into components. Authentication styles are scoped in `components/auth/auth.css` and use self-hosted Inter with its OFL license in `assets/fonts/`; other pages retain their existing styles. No runtime font service is used.

## Vercel configuration

When deployment is separately authorized:

1. Set the Vercel Root Directory to `frontend` and framework to Vite.
2. Set `VITE_API_BASE_URL` to the public backend HTTPS origin for the intended environment.
3. Use `npm run build` and output directory `dist` (`vercel.json` supplies these).
4. The SPA rewrite serves `index.html` for direct route visits and refreshes. Vercel serves existing static assets before its filesystem fallback rewrite.
5. Configure Render's `FRONTEND_URL` to the exact Vercel origin, without a trailing slash. Local API development needs the local origin allowed instead; the backend currently supports one configured origin. Preview domains are not automatically allowed.
6. Environment values are baked into the frontend build; rebuild after changing them.

The backend's CORS configuration was not modified. No deployment, production write or authentication request is part of this setup. Verify real-browser CORS and authenticated flows when API integration is implemented.

## FE-01 verification

Executed locally on Windows with Node 22.17.0:

- Dependency installation completed with no reported vulnerabilities.
- ESLint passed and all 19 unit tests passed.
- The Vite production build succeeded.
- A temporary Playwright/headless Edge smoke check against the production preview passed for all six placeholder routes, the root redirect and 404 at 1440px and 375px widths. Navigation, direct visits, reloads, page titles and horizontal overflow were checked; no browser errors or external API requests occurred. Browser tooling is not a project dependency.

The Vercel rewrite is configured but has not been verified on a live deployment. Login, backend CORS and authenticated API flows remain outside FE-01.

## Centered TaskFlow authentication redesign

Login/register share a single-column, 440px maximum-width layout with indigo actions, a lavender gradient, Vietnamese text and minimal branding/footer. No statistics, company information, compliance claims, SSO labels, remember-me control or empty second column is included.

Shared fields provide password visibility toggles, accessible labels/errors, validation, pending states and disabled duplicate submissions. Registration confirms passwords locally and sends only `name`, `email` and `password`. Password rules match the actual backend: at least 12 Unicode code points for registration, at most 72 UTF-8 bytes, nonblank and no NUL characters. No uppercase, digit or special-character rule is invented. Existing shorter passwords can still be used for login. Email is trimmed/lowercased; passwords are never trimmed. API errors are translated into Vietnamese without displaying raw server diagnostics. Navigating away aborts an in-flight submission.

Verification performed after this redesign: lint passed, all 27 unit tests passed and the production build succeeded. Headless Edge checked both routes at 375/768/1024/1440px, centered positioning, absence of overflow/promotional panels, short-screen scrolling, visibility toggles, loading, confirmation validation, normalized request payloads, navigation and mocked 200/201/400/401/409 responses. No React errors occurred. All authentication requests in verification were intercepted locally; no production login or account creation was performed. Live backend CORS and real credential flows still require a separately authorized check.

Changed source files: `layouts/AuthLayout.jsx`, `pages/LoginPage.jsx`, `pages/RegisterPage.jsx`, `hooks/usePageTitle.js`; new `hooks/useAuthForm.js`, `api/auth.js`, shared `components/auth/` files, Inter font/license and `tests/authValidation.test.js`. Routes, shared token storage, backend code and migrations were not changed.

## Frontend performance optimization

Previously, `useApiResource` discarded data on unmount and replaced content with loading states on every retry. Task writes retried list/statistics reads, project writes reloaded pages, and the Kanban revision counter recreated all three columns after each write. Its single pending flag also blocked every card. Separate project-catalog and task-detail keys duplicated equivalent requests between screens.

One TanStack Query client now owns authenticated read data. Keys in `src/query/keys.js` include each endpoint's scope, filters, sort and pagination. Dashboard project pages (size 4) remain distinct from project-management pages (size 9); all-project metadata is shared by Tasks and Kanban. Drawer and standalone task details share one key. `/auth/me` also uses this client, and authentication responses seed its user data.

- Fresh data is reused for 30 seconds; unused queries are collected after five minutes. No persistence, polling or window-focus refetch is enabled. Reconnection can revalidate stale data. Network GET failures retry once; HTTP errors and canceled requests do not retry. Writes are never automatically retried.
- Each token change synchronously aborts pending writes, cancels reads and clears all caches. Keys carry a monotonically increasing session generation, never the JWT. Late results cannot populate a new user's cache. Failed logout keeps the current session intact, matching the existing authentication behavior.
- Axios receives query abort signals. Affected reads pause during writes so late GET responses cannot overwrite optimistic changes. Other projects and other cards can continue working. Writes to the same entity are locked across components; task writes and changes to their parent project cannot race locally.
- Status changes immediately apply a per-task delta to existing task lists, task details and Kanban columns, including matching totals. Actual PATCH responses supply completion/update timestamps. Failure reverses only that entity's delta, retaining concurrent changes to other tasks, then revalidates affected data to resolve an uncertain server outcome. Sonner still handles progress, success and translated errors through the existing utility.
- Create/edit/delete use actual API responses. New rows are not arbitrarily inserted into sorted task/project pages. Membership changes, offset gaps and changed sort fields mark affected pages stale for background revalidation. Filters and current pages survive writes; deleting the last item can move back one page. Complete Kanban columns can be updated directly; incomplete prefixes accept only known sorted positions and revalidate gaps before loading the next offset. Timestamp ordering retains PostgreSQL submillisecond precision.
- Project edits/archive update existing project rows and the complete owned-project catalog directly. Archive restrictions continue to derive from server project status and backend authorization. Project deletion removes dependent task caches and invalidates affected dashboard data. Dashboard numbers and deadline membership come from the server; affected global/project queries are marked stale without inventing statistics or timezone calculations.
- Initial loads retain skeletons. Background loads keep content mounted, with Vietnamese synchronization/retry indicators. No cross-filter/page placeholder data is shown. Manual refresh still works without blanking the current data.

Measured with the isolated browser fixture (not production timing):

| Interaction | Previous behavior | Verified behavior |
| --- | --- | --- |
| Successful Kanban move, both columns fully loaded | PATCH + reload all 3 columns | 1 PATCH, 0 column GETs |
| Move from a partially loaded column | Reload all 3 columns | 1 PATCH + 1 affected-column refill GET in the fixture |
| Project edit | PUT + project-page GET | 1 PUT, 0 project GETs; catalog also updates |
| Tasks → Kanban within freshness window | Repeat all-project metadata GET | Shared catalog, 0 additional catalog GETs |
| Reopen details after a successful write | Fetch task details again | Reuse the actual mutation response |

These reductions exclude necessary dashboard revalidation. Failed/uncertain writes intentionally revalidate affected data, and incomplete or filtered/sorted pages may need additional GETs. Render cold starts, network latency, the existing 15-second Axios timeout, initial all-project metadata pagination and very large boards remain limitations. There is no realtime cross-browser subscription: external changes become visible through stale-query revalidation, reconnect or manual refresh. The main bundle is about 469 kB raw / 146 kB gzip; Kanban remains a separate lazy chunk, about 116 kB raw / 38 kB gzip.

Verification commands:

```powershell
cd frontend
npm ci
npm test
npm run lint
npm run build
```

For the optional isolated browser check, install temporary tooling (not a project dependency), start the production preview in one terminal, then run the script in another. It requires installed Microsoft Edge and intercepts all external traffic, including authentication; no real accounts or backend writes are used. The fixture expects the documented API origin and local preview port 4173.

Actual results on Windows / Node 22.17.0: all 121 tests passed (including 15 new cache tests), zero failures/skips; ESLint and the production build passed. The headless Edge script passed all six check groups: pointer drag/request reduction, concurrent success/rollback/toast, cross-route/detail reuse, project edit/background visibility, partial-column refill/pagination, and logout/new-session cache isolation. No production performance measurement, authentication, database connection, deployment or push was performed.

```powershell
npm install --no-save --package-lock=false playwright
node node_modules/vite/bin/vite.js preview --host=127.0.0.1 --port=4173 --strictPort
# Second terminal, also in frontend:
node scripts/performance-smoke.mjs
```

Files changed for this optimization (relative to `frontend/`):

- Dependencies/tooling: `package.json`, `package-lock.json`, `eslint.config.js`.
- New cache modules: `src/query/client.js`, `keys.js`, `mutations.js`, `resourceState.js`.
- Shared wiring: `src/main.jsx`, `src/contexts/AuthProvider.jsx`, `src/api/auth.js`, `projects.js`, `tasks.js`.
- Hooks: `src/hooks/useApiResource.js`, `useKanbanColumn.js`, `useNotifiedMutation.js`, `useTaskMutation.js`.
- Pages: `src/pages/DashboardPage.jsx`, `ProjectsPage.jsx`, `TaskDetailsPage.jsx`.
- Components: new `src/components/BackgroundSync.jsx`; updated `dashboard/ResourceState.jsx`, `dashboard/SummaryCards.jsx`, `tasks/TaskWorkspace.jsx`, `kanban/KanbanWorkspace.jsx`, `kanban/KanbanColumn.jsx`, `kanban/TaskDrawer.jsx`, `kanban/kanbanModel.js`.
- Verification/documentation: new `tests/queryCache.test.js`, `scripts/performance-smoke.mjs`; this `README.md`.

Reference for the adopted cache/cancellation/optimistic-update concepts: [TanStack Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates).

## All Projects on the Tasks page

`/tasks` defaults to **Tất cả dự án** (`all`), the first project-selector option. A project UUID or `/projects/:projectId/tasks` still selects an individual project; choosing All Projects from a project route navigates to `/tasks`. Each row shows its actual project and uses that project's archive restrictions. Create in the combined view starts with no target project: validation requires an accessible active project UUID. Editing preserves the task's association unless the user explicitly chooses another active project.

There is no global `GET /api/tasks` request. After the shared owned-project catalog loads, `loadTaskCollection` retrieves every project's task pages sequentially in batches of 100, with a shared limiter allowing at most **three task-page reads in flight** across projects. Empty projects count as successfully loaded. Query keys `tasks/collection/:projectId` hold complete project snapshots, independently of current table filters. No first-page-only aggregation is used.

Search, status/priority filters, sorting and pagination operate on the full combined collection, with accurate filtered totals. Task rows carry project metadata for the combined view. Enum priority/status ordering and timestamp precision are preserved; null dates follow PostgreSQL's default ascending/descending ordering. Client title sorting uses Vietnamese collation, which can differ from the database's configured text collation. Individual-project requests retain server-side sorting when no fresh complete snapshot is available.

Complete snapshots reuse the existing 30-second freshness and five-minute garbage-collection policy. Individual pages can be derived from a fresh complete snapshot without an extra GET. Returning to All Projects reuses the same per-project caches; changing search, sort or table page does not refetch every task. Mutation cache updates now include complete snapshots, including optimistic status rollback, creation, edits/project moves and deletion. Existing paginated-list, Kanban, dashboard and authentication-cache behavior remains intact.

Summary/status cards use the existing dashboard summary endpoint with the selected project UUID, or without `projectId` for All Projects. Overdue totals use the backend overdue endpoint with the same scope, page 0 and size 1, preserving server timezone/business rules. These cards describe the entire selected scope, independently of table filters.

If a project fails to load, its snapshot is not published as a partial success. Without a complete snapshot for every accessible project, the combined list and pagination totals are withheld. The UI names failed projects, shows a Vietnamese Sonner error and offers retry of only those failures. A failed background refresh retains the previous complete snapshot with an explicit stale-data warning. Changed page totals, duplicate/missing rows or mismatched project IDs also reject a snapshot rather than silently reporting completeness. The existing session-expiry flow cancels reads and clears the scoped caches. **Tải lại công việc** refreshes task data/statistics; **Tải lại dự án** refreshes the project catalog.

This remains a frontend workaround: the first combined load costs at least one task GET per project, plus subsequent pages, and filtering/sorting uses memory proportional to the total task count. Stale/manual refreshes may reread full project snapshots. Data read across multiple HTTP requests is not a transactionally consistent database snapshot; detected paging changes require retry. For large accounts, a future authorized backend endpoint should provide owner-scoped global search/filter/sort/pagination and summary data. No such endpoint, backend code or migration was introduced here.

Verification executed on Windows / Node 22.17.0:

- `npm test`: **129 passed**, zero failures/skips (eight additional tests for complete retrieval, cancellation/concurrency, global filtering/sorting/pagination, project validation and snapshot mutation consistency).
- `npm run lint` and `npm run build`: passed.
- `node scripts/all-projects-smoke.mjs`: four groups passed against isolated mocked HTTP responses in headless Edge. Checked 113 tasks across active/archived/empty projects, a second API page, maximum three concurrent reads, default/individual scope and cache reuse, names, global filters/pagination, backend overdue totals, CRUD in both scopes, required target UUIDs, archive locks, partial failure and targeted retry. No global tasks endpoint was called.
- Existing `node scripts/performance-smoke.mjs`: all six regression groups passed. Browser tooling/setup is described above. All external requests were intercepted; no production authentication, database writes, push or deployment occurred.

Files changed (relative to `frontend/`): `src/components/tasks/TaskWorkspace.jsx`, `TaskTable.jsx`, `TaskEditor.jsx`; `src/hooks/useApiResource.js`; `src/query/keys.js`, `mutations.js`; `tests/queryCache.test.js`; this `README.md`. New files: `src/api/taskCollection.js`, `src/components/tasks/combinedTasks.js`, `src/hooks/useTaskScopeResource.js`, `tests/allProjectsTasks.test.js`, `scripts/all-projects-smoke.mjs`.
