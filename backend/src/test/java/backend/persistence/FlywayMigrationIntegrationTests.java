package backend.persistence;

import java.sql.DriverManager;
import java.util.UUID;

import backend.support.PostgresTestSupport;
import backend.config.DatabaseMigration;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties = "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=")
@EnabledIf("backend.support.PostgresTestSupport#databaseAvailable")
class FlywayMigrationIntegrationTests extends PostgresTestSupport {
    @Test
    void existingV1DataSurvivesV2UpgradeAndChecksumsValidate() throws Exception {
        String name = "task7_migration_" + UUID.randomUUID().toString().replace("-", "");
        String migrationUrl = URL.replace("/task2_test", "/" + name);
        try (var admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("CREATE DATABASE " + name + " OWNER task2_migrator");
        }
        try {
            Flyway initial = Flyway.configure().dataSource(migrationUrl, "task2_migrator", "")
                    .defaultSchema("public").target("1").load();
            assertThat(initial.migrate().migrationsExecuted).isEqualTo(1);
            try (var admin = DriverManager.getConnection(migrationUrl, "task2_admin", ""); var statement = admin.createStatement()) {
                statement.execute("INSERT INTO public.users(id,email,name,password_hash) VALUES ('00000000-0000-0000-0000-000000000001','upgrade@example.invalid','Upgrade','test-only-hash')");
                statement.execute("INSERT INTO public.projects(id,owner_id,name) VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Upgrade')");
                statement.execute("INSERT INTO public.tasks(project_id,title,status) VALUES ('00000000-0000-0000-0000-000000000002','Preserved','DONE')");
            }
            Flyway latest = Flyway.configure().dataSource(migrationUrl, "task2_migrator", "").defaultSchema("public").load();
            // Local trust-auth test cluster accepts a nonempty test-only password.
            assertThat(DatabaseMigration.migrate(java.util.Map.of("FLYWAY_DB_URL", migrationUrl,
                    "FLYWAY_DB_USERNAME", "task2_migrator", "FLYWAY_DB_PASSWORD", "test-only")).migrationsExecuted).isEqualTo(1);
            assertThat(latest.validateWithResult().validationSuccessful).isTrue();
            assertThat(latest.migrate().migrationsExecuted).isZero();
            try (var admin = DriverManager.getConnection(migrationUrl, "task2_admin", ""); var statement = admin.createStatement();
                 var rows = statement.executeQuery("SELECT title, status::text, completed_at IS NOT NULL FROM public.tasks")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).isEqualTo("Preserved");
                assertThat(rows.getString(2)).isEqualTo("DONE");
                assertThat(rows.getBoolean(3)).isTrue();
            }
        } finally {
            try (var admin = adminConnection(); var statement = admin.createStatement()) {
                statement.execute("DROP DATABASE " + name + " WITH (FORCE)");
            }
        }
    }
}
