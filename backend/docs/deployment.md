# Deployment: Render + Supabase + Vercel

This is a deployment procedure, not a record of a live deployment. Nothing was pushed, published, or connected to production while preparing it.

## Supabase connection and roles

In your Supabase project, open Connect and select **Session pooler**. Copy the current host, database name, port and role username. Session mode uses port **5432** and supports IPv4, which is useful where the direct database IPv6 address is unavailable. Do not substitute transaction mode on port 6543: this application/Flyway expects session-compatible connection behavior. [Supabase connection documentation](https://supabase.com/docs/guides/database/connecting-to-postgres).

Use separate environment variables, not a password-bearing URI:

```text
DB_URL=jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require
DB_USERNAME=YOUR_RUNTIME_ROLE.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_RUNTIME_ROLE_PASSWORD
```

Use the username format shown by Supabase for the actual role; pooler usernames commonly append the project reference. Runtime is a dedicated `NOSUPERUSER NOBYPASSRLS` nonowner role, not `postgres` or a Supabase service-role key. DB_PASSWORD is the database role's password, not an anon/API key. Administrative provisioning and runtime grants are documented in [database-design.md](database-design.md).

`sslmode=require` encrypts transport. For certificate and hostname verification, use `sslmode=verify-full&sslrootcert=/etc/secrets/prod-supabase.cer`, supplying the CA certificate downloaded from Supabase at that path. Do not use `sslmode=disable`, trust-all hostname verifiers, or copy private keys into the image. [Supabase SSL modes](https://supabase.com/docs/guides/platform/ssl-enforcement).

If project network restrictions are enabled, authorize your deployment's egress through the Supabase controls. Keep app/database regions reasonably close. Hikari defaults to five connections per instance (`DB_POOL_SIZE`) with minimum idle one; budget for overlapping deploys/instances, the session pooler's backend connection limits and the extra migration connection. Tune using your actual Supabase limits rather than increasing the pool blindly.

## Migration procedure

Production web instances must use `FLYWAY_ENABLED=false`; Hibernate remains `ddl-auto=validate`. Run migrations separately with the schema-owner migration role, which must have CREATE/USAGE in public and ownership/DDL permissions for these application objects. The runtime role must not gain those permissions or membership in that role.

The packaged image includes a migration-only command:

```text
java -Dloader.main=backend.config.DatabaseMigration -cp /app/app.jar org.springframework.boot.loader.launch.PropertiesLauncher
```

It requires **all three** `FLYWAY_DB_URL`, `FLYWAY_DB_USERNAME`, `FLYWAY_DB_PASSWORD` variables explicitly. It does not start HTTP/Spring Security or require JWT secrets. Use a JDBC direct connection or the Session Pooler with SSL. The command uses the existing versioned migrations, validates checksums, leaves clean disabled and automatic baselining disabled, and exits nonzero on failure. It never runs seed data. The normal local app still defaults to Flyway startup migrations (`FLYWAY_ENABLED=true`) and may use DB credentials for that local setup.

For a fresh production database:

1. Inspect the target public schema and provision the dedicated migration/runtime roles through a secure administrator connection.
2. Run the migration-only command with the migration role.
3. Grant runtime DML/schema/type/function access as listed in database-design.md. Do not grant Flyway-history writes, TRUNCATE, schema CREATE or BYPASSRLS to runtime.
4. Start the web service with runtime DB credentials and `FLYWAY_ENABLED=false`. Hibernate validation must pass before the application is usable.

V1 assumes its four application tables and enums do not already exist. A nonempty public schema without Flyway history needs an explicit inspection/baseline/adoption plan; do not enable baseline-on-migrate, run the source schema SQL over it, or drop existing Supabase objects. Never edit an applied V1/V2, use clean in production, or enable Hibernate create/update. Applied database changes are not automatically rolled back when an application deployment is rolled back; use compatible migrations and a reviewed backup/recovery plan.

On Render plans that support a pre-deploy command, use the migration command there; failure must block the new application release. It runs after image build on a separate instance. Render currently limits pre-deploy commands to paid web services/private services/background workers. If unavailable, run the same image/command in a separately authorized release job before manually deploying the web instance. [Render deploy stages](https://render.com/docs/deploys).

Prefer a separate migration job/secret scope so the web process never receives migration credentials. If using a web service's pre-deploy hook with its shared environment, recognize that its migration variables are also visible to that service; remove that privilege exposure by moving the migration to a separate job when required. Do not fall back to running the web service as the migration owner.

## Render web service settings

After you review and commit the changes yourself:

| Setting | Value |
| --- | --- |
| Service | Web Service, Docker runtime |
| Repository root directory | `backend` |
| Dockerfile path | `./Dockerfile` relative to the root directory |
| Docker build context | `.` relative to the root directory |
| Docker/start command | Leave blank; image CMD runs `java -jar /app/app.jar` |
| Health check path | `/api/health` |
| Auto-deploy | Off for a controlled first deployment |

Render builds the image from the Dockerfile; no Maven build command is entered in the Docker service settings. Set DB_URL/DB_USERNAME/DB_PASSWORD, JWT_SECRET, JWT_EXPIRATION, FRONTEND_URL and `FLYWAY_ENABLED=false` in the service environment. PORT should use Render's provided value; the app binds to `0.0.0.0:${PORT}` (local fallback 8080). Render commonly supplies 10000; EXPOSE 8080 is only image metadata, not the runtime binding. [Docker on Render](https://render.com/docs/docker), [Render port binding](https://render.com/docs/web-services#port-binding).

Set `FRONTEND_URL=https://YOUR_FRONTEND.vercel.app` (one exact origin, no trailing slash or path). Use a new Base64 random JWT key decoding to at least 32 bytes; never reuse test keys. Set `JWT_EXPIRATION=900000` initially (15 minutes; supported 1–60 minutes). Choose `DASHBOARD_TIME_ZONE` deliberately and optionally set `API_DOCS_ENABLED=false` for public production instances. Do not paste secrets into Git, Docker build arguments, Java command arguments, logs or frontend variables.

The runtime is a nonroot Java 21 JRE image. `JAVA_TOOL_OPTIONS` initially caps heap at 65% of detected container memory, leaving space for threads/metaspace/native buffers; monitor the chosen Render instance's actual memory needs. Spring handles SIGTERM with a 20-second graceful-shutdown phase. The filesystem is disposable; persistence is entirely PostgreSQL. No extra disk or bundled PostgreSQL is needed.

`GET /api/health` returns 200 and `{"status":"UP"}` without JWT. It is suitable as the HTTP liveness check, but does not continuously query the database or certify external dependencies. Application startup still requires a reachable database and valid schema. Render uses the configured HTTP path for deployment/ongoing checks. [Render health checks](https://render.com/docs/health-checks).

## React frontend on Vercel

This repository does not contain a React frontend yet. For the separately built frontend, use its Render HTTPS API origin in a public client variable such as `VITE_API_BASE_URL=https://YOUR_BACKEND.onrender.com` if it uses Vite. Choose the correct public variable convention for that frontend's build tool. Set it for the intended Vercel environment and rebuild/redeploy after changes. [Vercel environment variables](https://vercel.com/docs/environment-variables).

The only backend-related value shipped to the frontend is the public API URL. DB credentials, JWT signing keys and migration credentials must never be client variables. Frontend requests send Authorization bearer headers and Content-Type; cookie credentials are disabled. Update Render FRONTEND_URL to the actual production/custom-domain origin. Preview origins are not automatically allowed; use separate reviewed preview/staging configuration rather than `*.vercel.app` or a wildcard.

## Smoke checks after an authorized deployment

Check `/api/health` over HTTPS, confirm protected endpoints return 401 without a token, then register/login with an authorized test user and exercise owned projects/tasks/dashboard and logout. Check CORS from the actual frontend origin, migration history/checksums, nonowner runtime privileges and logs without credential values. Swagger UI is `/swagger-ui.html` if enabled. None of these production checks were executed during implementation.

## Implementation verification and delivery checklist

- [x] Multi-stage Java 21 Dockerfile with a nonroot runtime and an allowlist build context.
- [x] PORT/host binding, graceful shutdown, runtime database/JWT/CORS variables, pool-size configuration and SSL-capable JDBC URLs.
- [x] Separate migration command, clean/baselining protections, unchanged versioned schemas and Hibernate validation.
- [x] Public health endpoint and Render/Supabase/Vercel setup instructions.
- [x] Complete root README; original assignment preserved in `docs/assignment.md` at repository root.
- [x] Targeted scan of 94 tracked paths (index + working files) and six new nonignored paths: zero findings. Local .env and JAR outputs are ignored; environment/key filename history check found no matches. No credential values were printed.
- [x] `mvn clean verify`: executable JAR packaged successfully on Java 21; 24 tests passed and 48 integration tests skipped without Docker/local override (72 discovered, zero failures/errors).
- [x] `scripts/Test-Postgres.ps1`: all 72 tests passed with zero skips/failures/errors on isolated PostgreSQL 18.7, including the migration-only V1→V2 upgrade. Temporary server stopped.
- [x] Packaged `PropertiesLauncher` migration entry point reached its explicit missing-variable guard, with no database connection attempted for that check.
- [ ] Docker image build/run and Testcontainers branch: unavailable Docker daemon prevented execution on this workstation.
- [ ] Authorized staging/live smoke checks against the actual Supabase version and deployed Render/Vercel origins.

Build log: ignored `backend/target-task8-build.log`; full-suite log: ignored `backend/target/task8-postgres.log`. The local PostgreSQL 18.7 run emits a warning that the Boot-managed Flyway version's tested range ends at PostgreSQL 17; migrations/validation did pass locally. Verify the target Supabase major version and migration compatibility in authorized staging rather than treating this as production verification.

No Git push, deployment, infrastructure provisioning or production database connection was performed.
