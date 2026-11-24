# Task 2: database design

The input is `database-schema.sql`; it is retained unchanged for comparison. The executable, reviewed schema is `src/main/resources/db/migration/V1__create_task_management_schema.sql`. Do not execute both files. Flyway manages the V1 transaction and checksum; do not edit an applied V1.

## Preserved model

- `users` owns `projects` and `sessions`; `projects` owns `tasks`.
- UUID primary keys use PostgreSQL `gen_random_uuid()` for SQL inserts and Hibernate UUID generation for JPA inserts.
- Foreign keys retain `ON DELETE CASCADE ON UPDATE CASCADE`. JPA associations are lazy, mandatory many-to-one references without cascade propagation to parents. No bidirectional collections or extra tables were added.
- Native, quoted PostgreSQL enums retain their exact names and values: `ProjectStatus` (`ACTIVE`, `ARCHIVED`), `TaskStatus` (`TODO`, `IN_PROGRESS`, `DONE`), `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`). Java uses `@Enumerated(STRING)`, `@JdbcTypeCode(SqlTypes.NAMED_ENUM)`, and the quoted column type. No ordinal or varchar enum conversion is used.
- Date-only fields map to `LocalDate`; `TIMESTAMPTZ(3)` fields map to `Instant`. Hibernate validates the schema and never creates it.
- Existing normalized/unique email, nonblank names/titles, project date order, session expiry, uniqueness, and foreign-key indexes remain.

## Review changes

| Issue | Resolution |
| --- | --- |
| Embedded `BEGIN`/`COMMIT` | Removed; Flyway owns the migration transaction. |
| Parent locking in `prepare_task_write()` | Both parent UUIDs remain ordered. `FOR NO KEY UPDATE NOWAIT` replaces blocking `FOR SHARE`, serializing writes per project without waiting while holding a task row. |
| Missing automatic timestamps | Database triggers update `updated_at` and preserve `created_at` on users/projects/tasks. Hibernate reads database-generated values after inserts/updates. Sessions retain only the timestamps in the original schema. |
| Task completion | Database assigns completion time when entering DONE, preserves it while DONE, clears it on reopen, and ignores client-supplied values. A check constraint enforces status/timestamp consistency. |
| Unbounded short fields | Email 254, user/project name 120, password/token hash 255, task title 255, color 32 characters. Optional descriptions remain TEXT with a 10,000-character check. Blank password/token hashes are rejected. These limits are explicit additions to the input schema. |
| Search | Added owner-scoped project-name and project-scoped task-title indexes on `lower(...) text_pattern_ops`, supporting case-insensitive prefix searches. Existing status, priority, due-date and session-expiry indexes remain. |
| RLS had no policies and assumed owner bypass | Enabled and forced RLS with explicit ownership policies; missing application identity denies access. Direct Supabase API-role table privileges are revoked where those roles exist. |

The search indexes support `lower(title) LIKE 'prefix%'` with the project ID (or name with owner ID). They do not optimize arbitrary substring searches. No extension is installed; `pg_trgm` can be considered later if substring search volume warrants it.

Task inserts/updates, including moves out of or into archived projects, are rejected if either parent is archived. Archiving does not delete or alter existing tasks. The source did not prohibit task deletion from archived projects, so no such new restriction is introduced.

## Transactions and concurrency

The task trigger locks both old/new projects in ascending UUID order before checking status. The locks conflict with project archive updates and are held until transaction completion. A competing writer receives SQLSTATE `55P03` (`lock_not_available`) immediately; roll back and retry the **whole transaction**, with bounded backoff, outside its original transaction. Do not retry a single statement in an aborted transaction. Task writes in the same project are deliberately serialized; unrelated projects can proceed independently.

This addresses the trigger's parent-lock waits and shared-lock upgrades, but does not make arbitrary multi-row application transactions deadlock-proof. Future services should use a consistent project/task lock order, keep transactions short, and handle PostgreSQL `40P01` (deadlock) and `40001` (serialization failure) with bounded transaction retries where safe. Read Committed is the expected default; higher isolation may require more retries. No service retry mechanism is introduced before business services exist.

## Ownership and future Spring Security/JWT integration

RLS **ENABLE alone is insufficient**: policies are required and owners normally bypass them. V1 also uses FORCE. PostgreSQL superusers and BYPASSRLS roles still bypass RLS and must never be used for application traffic.

Future backend services must:

1. Verify the JWT and obtain the user UUID from the authenticated Spring Security principal, never a request body or unverified claim.
2. Start a service transaction and use its same JDBC connection to execute the parameterized statement `SELECT set_config('app.current_user_id', ?, true)` before repository access. The final `true` scopes identity to that transaction; do not set session-wide identity on pooled connections.
3. Use ownership-scoped repository lookups (`findByIdAndOwner_Id`, `findByIdAndProject_Owner_Id`, etc.) and validate ownership on every relationship assignment, update and delete. General JpaRepository methods remain internal and are not authorization checks.
4. Roll back failures normally. Identity resets at commit/rollback. Missing identity intentionally returns no rows and rejects inserts; background jobs also need an explicit, reviewed identity/privilege design.

Policies check users by their own ID, sessions by user ID, projects by owner ID, and tasks through their owning project. They use `USING` and `WITH CHECK` to prevent reassignment to another owner. Supabase `auth.uid()` is not used: Spring JWTs do not automatically populate Supabase request claims on JDBC connections.

RLS trusts the backend database role to set the correct identity. Anyone holding that role's credentials could choose another UUID; keep JDBC credentials server-side. Public/anon/authenticated/service_role do not receive application-table access from this migration. Do not expose these tables through frontend Supabase queries.

Task 3 now provides authentication with a SELECT-only, exact-email lookup policy in V2, followed by password verification and transaction-local ownership context. Registration uses a server-generated user UUID. See [authentication](authentication.md) for the implemented bootstrap and API contract. RLS remains forced; runtime never needs BYPASSRLS.

## Supabase and deployment permissions

Use the Supabase JDBC direct connection or a JDBC-compatible session pooler, with TLS (`sslmode=require`, or verified TLS when certificates are configured). Do not use a transaction pooler for Flyway session advisory locks. No production database was contacted for this task.

Use separate roles: a migration owner that can create types/tables/indexes/functions/triggers/policies in `public`, and a nonowner runtime role with `LOGIN NOSUPERUSER NOBYPASSRLS`, schema USAGE and only SELECT/INSERT/UPDATE/DELETE on the four application tables. Runtime must have no CREATE on application schemas, no membership in the migration role, and no DDL, TRUNCATE, or Flyway-history write privileges. Do not use Supabase's powerful `postgres` account for runtime traffic.

Provision roles/passwords through a secure administrative channel before migration; role creation is intentionally outside V1. The migration owner must own newly created objects, be able to revoke Supabase default grants, and have schema CREATE/USAGE. No superuser-only extension is required. After migration, an administrator grants the runtime role (replace `tms_runtime` with the actual role):

```sql
GRANT USAGE ON SCHEMA public TO tms_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.users, public.sessions, public.projects, public.tasks TO tms_runtime;
GRANT USAGE ON TYPE public."ProjectStatus", public."TaskStatus", public."TaskPriority" TO tms_runtime;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO tms_runtime;
```

Ensure untrusted roles, including runtime, cannot CREATE in `public`; check existing schema ACLs before changing shared Supabase permissions. Forced RLS does not depend on the runtime being a table owner. Policies are scoped by the transaction identity; table privileges limit which database roles can use them.

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD` configure runtime connectivity. `FLYWAY_DB_URL`, `FLYWAY_DB_USERNAME`, `FLYWAY_DB_PASSWORD` optionally configure the separate migration connection and fall back to DB variables for local setup. For production, provide migration credentials only to the migration/deployment process; run Flyway there, grant runtime privileges, then start application instances with `SPRING_FLYWAY_ENABLED=false` and only runtime credentials. Hibernate validation stays enabled.

V1 assumes these four tables and enums do not already exist. Flyway will reject a nonempty schema without history. Inspect an existing Supabase schema before choosing an explicit migration/baseline plan; do not enable automatic baselining or run the original SQL over existing data.

## Optional development data

`scripts/seed-dev.sql` is a manual psql script outside Flyway locations. It refuses databases other than loopback `task2_dev`, requires an existing user UUID via `-v owner_id=...`, and creates one project and two tasks. It creates no accounts, passwords or sessions, and is never run at application startup or in production.

Example from `backend/`, with a locally configured psql connection and an existing development user:

```text
psql -h 127.0.0.1 -d task2_dev -U YOUR_DEV_ROLE -v owner_id=YOUR_EXISTING_USER_UUID -f scripts/seed-dev.sql
```

The script is repeatable via fixed UUIDs and ON CONFLICT; it does not overwrite edits. Completion and timestamp triggers also apply to seed data.

## Verification

`./mvnw compile test` now prefers Testcontainers for PostgreSQL integration tests when Docker is available. Without Docker or the isolated local override, database suites skip. See `api-documentation-and-tests.md` for current behavior.

On Windows with local PostgreSQL binaries installed, from `backend/`:

```powershell
.\scripts\Test-Postgres.ps1
# Or: .\scripts\Test-Postgres.ps1 -PostgresBin 'C:/path/to/postgresql/bin'
```

The script creates an isolated loopback cluster under ignored `target/`, chooses an available port, creates non-superuser migration/runtime roles, and runs compile and all tests. It stops its server in finally, restores its test URL environment variable, and leaves ignored cluster files/logs for inspection. The isolated cluster uses trust authentication for this local test only. No `.env`, DB_URL or production credentials are read.

Alternatively, explicitly configure `TASK2_TEST_DB_URL=jdbc:postgresql://127.0.0.1:PORT/task2_test` for a disposable local cluster with the test roles. The integration class accepts only loopback and the exact `task2_test` database name. It applies V1 with Flyway, checks validation and a no-op repeat migration, grants runtime DML, and starts Hibernate with `ddl-auto=validate`. Fixtures are deliberately truncated between tests, so this must be a disposable database.

The suite checks real enum/UUID persistence, database-generated timestamps and completion transitions, length/integrity/FK constraints, ownership and missing-context isolation including non-superuser owners, cascades, opposite task moves, and both orderings of archive/write conflicts. Supabase-specific production permissions and connectivity remain deployment checks requiring authorization.

Verified locally with PostgreSQL 18.7 and Java 21: compile succeeded and all 21 tests passed (including 11 PostgreSQL integration tests). Flyway V1 applied successfully, its checksum validated, the repeat migration was a no-op, and Hibernate validation succeeded. The development seed was run twice without duplicates and refused a different database name. Temporary test servers were stopped after verification.

Reference behavior: [PostgreSQL row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [PostgreSQL row locking and deadlocks](https://www.postgresql.org/docs/18/explicit-locking.html), and [Hibernate native enums and generated values](https://docs.hibernate.org/orm/6.6/introduction/html_single/).
