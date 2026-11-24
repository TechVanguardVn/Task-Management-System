package backend.config;

import java.util.Map;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;

/** Separate deployment command: no HTTP server, JWT configuration or runtime role. */
public final class DatabaseMigration {
    private DatabaseMigration() { }

    public static void main(String[] args) {
        migrate(System.getenv());
    }

    public static MigrateResult migrate(Map<String, String> environment) {
        return Flyway.configure()
                .dataSource(required(environment, "FLYWAY_DB_URL"), required(environment, "FLYWAY_DB_USERNAME"),
                        required(environment, "FLYWAY_DB_PASSWORD"))
                .defaultSchema("public").locations("classpath:db/migration")
                .cleanDisabled(true).baselineOnMigrate(false).validateMigrationNaming(true)
                .load().migrate();
    }

    private static String required(Map<String, String> environment, String key) {
        String value = environment.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(key + " must be set for the migration-only command");
        }
        return value;
    }
}
