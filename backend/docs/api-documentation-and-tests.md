# Task 7: OpenAPI and automated tests

## Swagger UI

Start the backend with its usual environment variables, then open `/swagger-ui.html` (redirects to `/swagger-ui/index.html`). The generated JSON definition is `/v3/api-docs`; Swagger configuration is `/v3/api-docs/swagger-config`.

springdoc-openapi 2.10.1 is pinned for Spring Boot 3.5.16, following the [official compatibility matrix](https://springdoc.org/v2/faq.html#what-is-the-compatibility-matrix-of-springdoc-openapi-with-spring-boot). Swagger UI authorization is not persisted across reloads. `API_DOCS_ENABLED=false` disables both the document and UI when needed. Documentation assets are public GET routes; this does not permit anonymous project/task/dashboard access.

The definition documents all 20 operations: health, four auth operations, six project operations, six task operations, and three dashboard operations. It contains summaries, behavior/default/ownership descriptions, request/response examples, pagination/filter/sort parameters, schemas and success/error status codes. Documentation is centralized in `OpenApiConfig`; controller return/request types still generate the actual schemas. A generated-document integration test counts the operations and checks security, responses, examples and principal hiding to detect drift.

The global HTTP Bearer scheme is `bearerAuth`, format JWT. Health/register/login explicitly override it with no security requirement. To try protected operations:

1. Register or log in with your own development account.
2. Copy the returned `accessToken`.
3. Click Authorize and paste the token without the `Bearer ` prefix.
4. Try `/api/auth/me` or an owned resource. Logout revokes that token.

Examples use fictional accounts and a deliberately unusable token. Password schemas are write-only and formatted as passwords. Authenticated principals are hidden from client parameters. Credentials/hashes are never included as response properties. The business contracts remain documented in `authentication.md`, `projects.md`, `tasks.md`, and `dashboard.md`.

Common statuses are documented with the shared error DTO: 400 invalid input, 401 invalid/missing/expired/revoked credentials, 403 forbidden, 404 missing/foreign resource, 409 duplicate/archive/integrity/concurrency conflict, 503 authentication store unavailable, and 500 unexpected errors. Creation returns 201 plus Location; deletion/logout return 204 without a body; successful reads/updates return 200. Registration returns 201 without Location because its response represents the auth session rather than a public user-resource URL.

## Running tests

From `backend/`:

```text
./mvnw compile test
```

JUnit 5 and Mockito tests run without application database credentials. The test signing keys/passwords are fixtures, not production configuration. Service unit tests verify credential rejection/dummy hash comparison, session hashing/revocation, ownership rejection before mutation, archive guards and PostgreSQL UUID lock ordering.

Database tests prefer Testcontainers automatically when Docker is available. One disposable `postgres:18-alpine` container is created per test JVM; no external DB URL is taken from application settings. It provisions separate admin, migration and non-superuser/non-BYPASSRLS runtime roles. Trust authentication is used only inside this isolated test cluster to preserve the test-role setup. The container is stopped on JVM exit, with Testcontainers cleanup as a fallback. Run the suite sequentially; fixtures intentionally truncate their disposable data between tests.

If Docker is unavailable and no explicit local override exists, database integration classes skip. A Maven success with skipped integration tests is not proof that the API/database tests passed. Check `target/surefire-reports` for actual executed/skipped counts.

On Windows, the existing isolated local PostgreSQL fallback executes the same integration suites:

```powershell
.\scripts\Test-Postgres.ps1
# Optional: -PostgresBin 'C:/path/to/postgresql/bin'
```

It creates a fresh loopback cluster, chooses an available port, exports its URL for the child test process, runs the suite, restores the environment and stops its server in finally. Ignored `target/` files/logs remain for inspection.

An explicit `TASK2_TEST_DB_URL` override is accepted only for `jdbc:postgresql://127.0.0.1:PORT/task2_test` or `jdbc:postgresql://localhost:PORT/task2_test`, without query options. It must point to a disposable cluster with the documented test roles; never tunnel that override to a production database. Invalid overrides fail before opening a connection. Application DB_URL/DB_USERNAME/DB_PASSWORD, Supabase URLs, and `.env` files are not used for test connections. Dynamic test properties override application datasource/Flyway settings. Unit tests exercise the URL rejection guard.

## Coverage

- Real HTTP-controller/security flows through MockMvc: registration/login/logout, revoked/expired tokens, full register → project → task → dashboard → logout flow.
- Ownership and RLS: foreign user access across projects/tasks/dashboard, missing principal context, forced RLS on non-superuser table owners, read-only login bootstrap, session identity reset.
- Validation/errors: malformed JSON, invalid fields/enums/UUIDs/pagination/sort, safe error responses, no rejected secret values.
- Data behavior: project/task CRUD, cascades, archived restrictions, status/completion timestamps, search/filter/sort/pagination, dashboard date boundaries/aggregation and bounded query counts.
- Migration compatibility: fresh V1/V2 migration and checksum/no-op validation, real Hibernate schema validation, and an upgrade test that applies V1 in another disposable database, inserts data, applies V2, verifies preservation/checksums, then drops only that database.
- Documentation: generated spec for every endpoint, public Swagger assets, Bearer security, examples, status codes and write-only password schema. Protected APIs remain 401 without JWT.

Executed results on Java 21:

| Command | Result |
| --- | --- |
| `./scripts/Test-Postgres.ps1` | Compilation succeeded; 71 tests passed, 0 failures/errors/skips, using isolated PostgreSQL 18.7. Server stopped afterward. |
| `mvn compile test` without Docker/local override | Compilation succeeded; 23 tests passed and 48 database tests skipped, 0 failures/errors. |

Logs are in ignored `target/task7-postgres-final.log` and `target/task7-default-tests.log`. Surefire reports reflect the most recent run, so the later default run records skips for database suites.

Docker was unavailable in the implementation environment, so the Testcontainers execution branch could not be verified there. The 71-test result comes from the local PostgreSQL fallback, not Docker. No production Supabase database was contacted or modified.
