# Task 3: authentication and security

## API contract

| Endpoint | Access | Request/response |
| --- | --- | --- |
| `POST /api/auth/register` | Public | JSON `email`, `name`, `password`; returns 201 and an auth response. Duplicate normalized email returns 409. |
| `POST /api/auth/login` | Public | JSON `email`, `password`; returns 200 and an auth response. Wrong password/unknown email return the same generic 401. |
| `POST /api/auth/logout` | Bearer JWT | Revokes the current session and returns 204. |
| `GET /api/auth/me` | Bearer JWT | Returns the authenticated user's `id`, `email`, `name`. |

Auth responses contain `accessToken`, `tokenType` (`Bearer`), `expiresAt` (UTC instant), and `user` (`id`, `email`, `name`). Responses use DTOs, never entities or credential hashes. Registration also creates a session; the client can use its returned access token immediately. Token responses use `Cache-Control: no-store`.

Send protected requests with `Authorization: Bearer <accessToken>`. Never put tokens in URLs. The application does not authenticate via cookies, form login, HTTP Basic or HTTP sessions. Only health and the two public POST endpoints are permitted anonymously; project/task/dashboard routes now require authentication and owner-scoped service access (see `projects.md`, `tasks.md`, and `dashboard.md`). Other business routes remain denied until their authorization rules are implemented. Missing/invalid credentials return 401; authenticated callers to denied routes receive 403. Errors retain the standard `ApiErrorResponse` structure. Authentication-store failures in the bearer filter fail closed with a generic 503.

Emails are stripped and lowercased with `Locale.ROOT` before validation, lookup and persistence. Names are stripped and limited to 120 characters. Emails must be valid and at most 254 characters. Registration passwords require at least 12 Unicode code points and at most 72 UTF-8 bytes, cannot be blank and cannot contain NUL. Passwords are never trimmed or normalized. The byte limit avoids BCrypt truncation; registration and login reject oversized byte sequences. Login accepts nonblank passwords of at least one character so an incorrect short password produces a generic credential failure rather than applying registration policy to existing accounts.

BCrypt strength 12 is used. A BCrypt comparison against a per-process dummy hash also occurs for unknown emails. Database uniqueness resolves concurrent registration races. Credential-bearing DTOs redact `toString`; the application does not log passwords/tokens. Request-body and JDBC bind-value debug logging are suppressed. Do not override these protections with request/header/body or SQL bind logging in deployment.

## Session-backed JWT design

This implementation uses the permitted **session mechanism**, not refresh tokens:

- Each successful registration/login creates an independent row in the existing `sessions` table.
- Access tokens are signed using HS256. Claims include fixed issuer/audience, a user UUID in `sub`, a session UUID in `jti`, `iat`, `nbf` and `exp`. The signing algorithm is pinned; expiration, issuer, audience, required identity/time claims, type and maximum lifetime are validated. No permissions are accepted from client-supplied token claims.
- Only the SHA-256 hash of the complete signed JWT is stored in `sessions.token_hash`. JWTs include a random session UUID, so different sessions produce different tokens/hashes even when created in the same second. The plaintext token is returned once and is not persisted.
- After cryptographic verification, every authenticated request checks user/session IDs, the token hash, `revoked_at IS NULL`, and session expiration. A valid signature alone is insufficient. Authentication is stateless with respect to HTTP sessions, but intentionally depends on PostgreSQL to support revocation.
- Logout marks only the presented token's session as revoked. Once logout commits, that token is rejected on subsequent requests even if its JWT expiration is still in the future. Other logins/devices remain active. Already authorized requests may finish concurrently with logout. Reusing a logged-out or expired token, including to log out again, returns 401.
- There is no refresh endpoint, refresh token, silent renewal or refresh-token cookie. After expiration, clients must sign in again. The client should discard its token after logout. Do not treat `sessions.token_hash` as a refresh token.

`JWT_SECRET` is required Base64-encoded cryptographically random material decoding to at least 32 bytes. It has no default. For example, generate 32 random bytes using a secure local generator and Base64-encode them; keep the result in environment/secret storage, never source control. Test fixtures use test-only keys and must not be reused in deployment.

`JWT_EXPIRATION` is milliseconds: default `900000` (15 minutes), accepted range `60000` to `3600000`. Bad keys/expiration settings fail startup without echoing the secret. Keep application/database clocks synchronized. Rotating the signing key invalidates all existing JWTs; coordinated key rotation with overlapping keys is outside this task. Deploy behind HTTPS, redact Authorization headers at the proxy, and apply auth endpoint rate limits before public deployment.

CSRF is disabled for this bearer-only API because browsers do not automatically attach its authentication credentials. CORS remains restricted to `FRONTEND_URL`, with cookie credentials disabled. If cookie authentication is introduced later, revisit CSRF and cookie controls as part of that change. Browser token storage and XSS protection must be designed in the frontend; this backend does not set a token cookie.

## Forced RLS and credential bootstrap

V1 is unchanged. V2 adds a SELECT-only `users_login_lookup` policy matching one normalized email in transaction-local `app.login_email`. `AuthService.login()` starts a transaction, sets that lookup email using a parameterized `set_config(..., true)`, fetches credentials, and verifies BCrypt. It then clears the lookup setting and establishes `app.current_user_id` before inserting a session. Failed login rolls back its transaction/context.

Registration generates the UUID on the server and sets it as the local user context before inserting that exact user; it never accepts a user ID from the request. Authenticated session checks, `/me`, and logout establish identity from the **verified** principal within their own transactions. `RlsContext` requires an active transaction. Identity is never set session-wide, so pooled connections do not retain it after commit/rollback. Each future business service must establish its own verified identity inside its own transaction; the filter's completed transaction does not carry RLS context into controller/service transactions.

The added policy grants no unauthenticated UPDATE/DELETE/INSERT access and opens no project/task/session rows. It is a narrowly scoped credential lookup for the trusted backend, not a public database API. The runtime role already has server-side SELECT privileges and the ability to set trusted RLS context. Anyone with runtime database credentials could impersonate that context; RLS does not protect against a compromised trusted backend. Runtime credentials must remain server-side, with no superuser/BYPASSRLS/schema CREATE privileges or membership in the migration owner role. Supabase frontend/API roles remain without direct access to these four tables.

Apply V2 using the configured migration owner. Existing runtime grants from Task 2 suffice; no privileged function, new role, extra table, schema reset or owner bypass is required. An existing Supabase database has not been contacted or modified. Follow the separate migration/runtime deployment procedure in `database-design.md`.

## Verification

From `backend/`, `./mvnw compile test` runs unit checks and, when Docker is available, Testcontainers integration tests. Database suites skip only when neither Docker nor the isolated local override is available. See `api-documentation-and-tests.md` for current commands and safety checks.

On Windows, `./scripts/Test-Postgres.ps1` creates an isolated loopback PostgreSQL cluster, applies V1/V2, runs all tests and stops the cluster. It never reads production DB variables or `.env` files. Shared test support rejects non-loopback URLs and database names other than `task2_test`.

Tests cover normalized registration, duplicate email, BCrypt/token-hash storage, input validation including UTF-8 byte limits, login failure/success, `/me`, session isolation, logout/revoked and expired sessions, expired/tampered/unsigned/wrong-key JWTs, issuer/audience/claim validation, protected-route 401/403 behavior and the SELECT-only login RLS policy. Existing migration, entity, constraint and concurrency tests remain included.

Verified with Java 21 and isolated PostgreSQL 18.7: compilation and all 34 tests passed, with no failures or skips (including 20 database integration tests). Flyway applied V1/V2 successfully and Hibernate validation passed. The temporary server was stopped. No Supabase connection or production migration was attempted.

Implementation references: [Spring Security JWT validation](https://docs.spring.io/spring-security/reference/6.5/servlet/oauth2/resource-server/jwt.html) and [password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html).
