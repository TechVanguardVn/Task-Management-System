# FE-03: TaskFlow application layout

> Historical FE-03 implementation record. Current features include project/task CRUD, dashboard and Kanban; FE-08 restores unexpired same-tab sessions through sessionStorage plus `/api/auth/me`. See the [current README](../README.md) for cache/authentication and deployment behavior.

The Stitch dashboard is a visual reference for the shell only. FE-03 supplies a white 240px desktop sidebar, white sticky header, lavender canvas, Inter typography and indigo active navigation. There are no demo users, mock API responses, counters, metrics, charts or business-data requests in application code. Dashboard statistics remain FE-04.

## Navigation and responsiveness

- Tổng quan: `/dashboard`
- Việc của tôi: `/tasks`
- Dự án: `/projects`
- Bảng Kanban: `/kanban`

No settings route, search, organization selector, subscription, notification, storage meter, support widget or unimplemented action is displayed. The existing placeholder pages are localized into Vietnamese.

At 1024px and wider the sidebar is persistent. Below 1024px the header opens a native modal dialog containing the same Sidebar component. The browser supplies a focus trap and Escape handling. The drawer also closes on navigation, outside click and resizing to desktop, and restores prior focus. Main padding is 32px desktop, 24px tablet and 16px mobile. The user disclosure supports keyboard navigation, Escape, outside-click dismissal and focus restoration. Logout errors remain visible while the pending button is disabled.

## Identity and session lifecycle

`AuthProvider` extends the existing in-memory token store. Login/register call `completeAuthentication` with their actual backend response, reusing the returned user without an extra profile request. If a token is present without a user, the provider makes one deduplicated `GET /api/auth/me`, including under React StrictMode. Old requests are aborted/ignored when tokens change. Names and email come from backend user data; no profile or organization information is invented.

`ProtectedLayout` wraps workspace routes. Missing sessions redirect to `/login`; a checking state exposes no workspace content. A failed profile lookup presents a retry/return-to-login screen. The existing Axios 401 behavior clears user state as well as the token. The backend-returned `expiresAt` schedules local expiry; server-side validation remains authoritative. Tokens remain memory-only, so reloads require signing in again. No refresh token or persistent session feature has been added.

The user menu calls `POST /api/auth/logout` with the current token. Successful revocation (or an already invalid 401 session) clears token/user state and returns to login. Network/server failures retain the session and show a retryable error; local clearing alone cannot promise server revocation. Concurrent logout calls share a request.

`UserAvatar` derives initials on each render. Names are normalized to Unicode NFC, trimmed and split on whitespace. First/last word initials are uppercased using Vietnamese casing; a single word supplies one initial and a missing name supplies `U`. No external avatar service, image URL or client credential is used. Updated user data updates the initials automatically.

## Files

New:

- `src/components/layout/`: Header, Sidebar, MobileNavigation, UserMenu, UserAvatar, navigation configuration, initials helper and scoped workspace styles.
- `src/layouts/ProtectedLayout.jsx`.
- `src/contexts/createAuthSession.js` and `authSession.js`.
- `tests/authSession.test.js` and `userInitials.test.js`.
- This document.

Updated:

- `src/layouts/AppLayout.jsx` and `src/routes/AppRoutes.jsx`.
- `src/contexts/AuthProvider.jsx`, `src/hooks/useAuthForm.js` and `src/api/auth.js`.
- `src/components/Icon.jsx`, `src/components/PlaceholderPage.jsx`, and the four workspace placeholder pages.
- `README.md`.

Login/register page markup and styling are unchanged by FE-03; their internal success handler now passes the entire response to shared auth state. No backend, migration, dependency or lockfile change is required.

## Verification

Executed locally:

- `npm run lint`: passed.
- `npm test`: 50 tests passed, zero failures/skips. New tests cover Vietnamese/decomposed Unicode initials, supported navigation, cached identity, deduplicated profile loading, stale responses, invalid sessions, retries and logout behavior, including a late logout response after a newer sign-in.
- `npm run build`: passed.
- Temporary headless Edge checks at 375, 768, 1024 and 1440px: protected redirects, no horizontal overflow, active navigation, drawer keyboard focus trap/Escape/resize/route dismissal, user menu, initials, identity reuse, `/me` deduplication, logout success/failure/retry, 401 handling, local expiry and reload behavior passed. No React errors occurred.

Automated tests use isolated fixtures only; production application code always uses the configured backend. Browser authentication requests were intercepted by the test runner, with unexpected external traffic blocked. No production account creation, login, logout, database connection, deployment or Git push occurred. Actual Render CORS and real-credential end-to-end behavior remain unverified.
