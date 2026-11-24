# Global toast notifications

The frontend uses [Sonner](https://sonner.emilkowal.ski/toaster) 2.0.8 with one `GlobalToaster` mounted in `main.jsx`, beside the application routes. The shared configuration enables rich colors, a close button, Vietnamese accessibility labels, at most three visible notifications and a 3500ms default duration. Desktop toasts appear at the top-right below the header; mobile offsets keep them inside the viewport. The app currently has a light theme; no unrelated theme switch or layout change was introduced.

## Usage

```js
import { notify } from '../lib/notify.js'

notify.success('Đã lưu thay đổi.')
notify.error('Không thể hoàn tất yêu cầu.', { description: 'Vui lòng thử lại.', duration: 5000 })
notify.warning('Vui lòng kiểm tra thông tin.')
notify.info('Dữ liệu đã được tải lại.')
const id = notify.loading('Đang xử lý…')
notify.dismiss(id)
```

Every method except dismiss returns a toast ID. Success/error/warning/info accept optional Sonner options such as `description`, `duration` and `id`. Reusing a loading ID replaces its notification and clears its deadline. A completion toast resets to 3500ms unless explicitly configured; it does not inherit the longer loading deadline.

Do not call Sonner directly from pages or create another Toaster. `startOperationNotification` centralizes the actual auth/project/task copy and handles the operation lifecycle. `useNotifiedMutation` supplies the common task/project single-flight, session, cancellation and field-error behavior; their existing hooks remain domain-specific wrappers. Background GET requests keep their existing page/column error/retry states and do not call notify.

## Loading and duplicate prevention

Mutation/auth loading notifications start after 500ms, avoiding spinner flashes for fast operations. Completion replaces that loading ID or creates one success/error toast if no spinner was needed. A finished/canceled operation cannot notify again. Unmounts, cancellation and obsolete sessions dismiss active loading and cancel delayed notifications. Existing AbortControllers, duplicate-request guards, owner queries and authentication semantics are retained.

Sonner loading notifications normally stay until explicitly updated/dismissed. `createNotify` also applies an independent 30-second watchdog; custom loading deadlines are bounded to 60 seconds. This prevents indefinitely stuck loading even if a caller fails to complete its lifecycle. Existing API timeouts remain 15 seconds. Normal success/error duration remains configurable.

Success is emitted only after API resolution, never at the start of optimistic UI updates. Kanban still rolls back its projection after failed PATCH, then reports the status failure with a safe explanatory description. A same-column/canceled drop does not issue a mutation and produces no toast. There are no automatic mutation retries.

## Authentication and error policy

Login/register success notifications persist across the redirect. Invalid login credentials and network failures use Vietnamese messages; registration failure has its requested generic title with a safe explanation, including duplicate-email conflicts. Client validation stays inline without toast noise. Server field errors remain beside the relevant input; the duplicate general auth API banner was removed.

Logout success is emitted only after the revocation request resolves for the current session. The existing already-expired-logout redirect behavior is preserved, but a rejected 401 does not produce a confirmed-logout success toast. Failed logout retains its persistent recovery message and also gives a short failure notification. Injected lifecycle callbacks allow this to be tested without coupling session state to Sonner.

The Axios factory accepts an optional session-expiry notification callback. Only a 401 carrying the matching current bearer token invokes it, then clears that token as before. Simultaneous/late 401s and anonymous invalid-login responses cannot generate repeated expiry notifications. The local expiration timer uses the same warning ID. A successful new authentication dismisses an old expiry warning. No general response interceptor creates error toasts for ordinary GET failures.

`apiErrorMessage` maps network failures, timeouts, validation, 401/403/404/409/429 and server errors to safe Vietnamese text. It deliberately does not display arbitrary backend `message`, exception, SQL, request configuration or stack-trace strings. Existing allowlisted auth/project/task field mappers continue to handle `validationErrors`; unknown fields/diagnostics are ignored. Abort/cancel errors are silent. Mutation forms keep a separate persistent instruction to check fields or reload uncertain data, rather than repeating the entire toast verbatim. Confirmation dialogs and important GET/column error states remain.

## Native modals and accessibility

Native `<dialog>` elements occupy the browser top layer, where a body-level toast cannot simply be raised with z-index. `GlobalToaster` uses one stable portal host and moves that host into the active native modal, returning it to the body when the modal closes. A MutationObserver handles nested editor/drawer dialogs. The Toaster React instance/configuration stays global; no route-specific Toasters are added. This keeps toast close buttons visible, focusable and clickable within the modal's focus boundary.

Sonner supplies a polite live region and type icons. Close controls are labeled “Đóng thông báo”; typography, corners, borders, shadow and indigo focus/info colors follow TaskFlow. Reduced-motion preferences are honored. The portal host does not capture pointer events outside the toast surface. Notifications do not grab form focus or create another modal interaction.

## Verification

Executed on Windows with Node 22.17.0:

- `npm install sonner`: completed, zero reported vulnerabilities. Only Sonner was added as a project dependency; temporary browser/formatter tools are not dependencies in package.json/lockfile.
- `npm run lint`: passed.
- `npm test`: **106 passed**, zero failures/skips. New tests cover safe message mapping, notification types/options, delayed loading, same-ID completion, default-duration restoration, timeout watchdogs, cancellation cleanup, duplicate finish suppression, registration error copy, concurrent/stale/public 401 handling and confirmed-only logout success callbacks.
- An existing navigation test expected an older sidebar order. It now checks the supported route set independently of presentation order; application navigation was not changed.
- `npm run build`: passed, preserving the separate lazy Kanban chunk.
- Headless Edge against the built preview: successful/failed login and registration, network errors, logout, all project create/update/archive/delete notifications, task create/update/delete/status, API conflicts, preserved inline recovery, pointer drag rollback, same-column no-op, drawer/editor portal transitions and closeable notifications passed.
- Single-Toaster/notification checks, loading-to-success/error replacement, loading cleanup on navigation, silent failed GET, one warning for concurrent 401 responses, local expiration and desktop/mobile bounds at 1440/375px passed. No application browser errors or page-level horizontal overflow occurred. Screenshots were visually reviewed.

All browser authentication and API traffic was intercepted with isolated test fixtures. No production account/project/task was created or changed. These checks do not establish live staging CORS/database behavior. No backend/Supabase/migration changes, push or deployment occurred.

## Files created

- `src/lib/notify.js`
- `src/lib/createNotify.js`
- `src/lib/apiErrorMessage.js`
- `src/lib/operationNotification.js`
- `src/components/notifications/GlobalToaster.jsx`
- `src/components/notifications/toasts.css`
- `src/hooks/useNotifiedMutation.js`
- `tests/notifications.test.js`
- `docs/notifications.md`

## Files modified

- `package.json`, `package-lock.json`, `README.md`, `src/main.jsx`
- `src/api/client.js`, `src/api/createApiClient.js`
- `src/contexts/AuthProvider.jsx`, `src/contexts/authSession.js`, `src/contexts/createAuthSession.js`
- `src/hooks/useAuthForm.js`, `src/hooks/useProjectMutation.js`, `src/hooks/useTaskMutation.js`
- `src/components/auth/AuthForm.jsx`, `src/components/auth/validation.js`
- `src/components/projects/ProjectEditor.jsx`, `src/components/projects/ProjectConfirmation.jsx`, `src/pages/ProjectsPage.jsx`
- `src/components/tasks/TaskEditor.jsx`, `src/components/tasks/TaskDeleteDialog.jsx`, `src/components/tasks/TaskWorkspace.jsx`
- `src/components/kanban/KanbanWorkspace.jsx`, `src/components/kanban/TaskDrawer.jsx`
- `tests/apiClient.test.js`, `tests/authSession.test.js`, `tests/userInitials.test.js`
