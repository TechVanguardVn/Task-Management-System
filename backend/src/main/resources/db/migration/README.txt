Place versioned SQL migrations here using V<version>__<description>.sql.
V1 defines the four-table Task Management schema reviewed from docs/database-schema.sql.
V2 adds transaction-local, SELECT-only email lookup for backend authentication.
Flyway manages schema changes; Hibernate only validates them.
Do not edit migrations after they have been applied.
Optional development data is in scripts/seed-dev.sql, outside the migration path.
