package backend.config;

import java.util.Map;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class DatabaseMigrationTests {
    @Test
    void migrationCommandRequiresExplicitMigrationCredentialsWithoutEchoingThem() {
        assertThatThrownBy(() -> DatabaseMigration.migrate(Map.of()))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("FLYWAY_DB_URL must be set");
        assertThatThrownBy(() -> DatabaseMigration.migrate(Map.of("FLYWAY_DB_URL", "fictional-test-url")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("FLYWAY_DB_USERNAME must be set")
                .hasMessageNotContaining("fictional-test-url");
        assertThatThrownBy(() -> DatabaseMigration.migrate(Map.of("FLYWAY_DB_URL", "fictional-test-url",
                "FLYWAY_DB_USERNAME", "fictional-user", "FLYWAY_DB_PASSWORD", " ")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("FLYWAY_DB_PASSWORD must be set");
    }
}
