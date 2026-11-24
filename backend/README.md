# Task Management System backend

The complete project README is [../README.md](../README.md), covering features, Java 21 setup, environment variables, migrations, API documentation, tests and deployment.

Run commands from this directory:

```text
./mvnw spring-boot:run
./mvnw clean verify
```

PowerShell uses `.\mvnw.cmd`. Copy `.env.example` locally, then explicitly export its values or configure your IDE; Spring Boot does not load .env automatically.

- [Deployment: Render, Supabase Session Pooler and Vercel](docs/deployment.md)
- [Authentication](docs/authentication.md), [projects](docs/projects.md), [tasks](docs/tasks.md), [dashboard](docs/dashboard.md)
- [Database design and RLS](docs/database-design.md)
- [Swagger UI and automated testing](docs/api-documentation-and-tests.md)

The multi-stage Docker build context is this directory. Production web instances use `FLYWAY_ENABLED=false` after a separately authorized migration with dedicated credentials. No deployment is performed automatically.
