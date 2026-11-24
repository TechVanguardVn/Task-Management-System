package backend.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.flywaydb.core.Flyway;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

public abstract class PostgresTestSupport {
    protected static String URL = System.getenv("TASK2_TEST_DB_URL");

    public static boolean databaseAvailable() {
        if (System.getenv("TASK2_TEST_DB_URL") != null) {
            validateLocalUrl(System.getenv("TASK2_TEST_DB_URL"));
            return true;
        }
        return DockerAvailability.AVAILABLE;
    }

    private static class DockerAvailability {
        private static final boolean AVAILABLE = DockerClientFactory.instance().isDockerAvailable();
    }

    private static class ContainerDatabase {
        private static final PostgreSQLContainer<?> INSTANCE = start();

        private static PostgreSQLContainer<?> start() {
            var container = new PostgreSQLContainer<>("postgres:18-alpine")
                    .withDatabaseName("task2_test").withUsername("task2_admin").withPassword("test-only")
                    // Disposable test cluster only; existing tests use empty-password DML roles.
                    .withEnv("POSTGRES_HOST_AUTH_METHOD", "trust").withInitScript("db/test-roles.sql");
            container.start();
            Runtime.getRuntime().addShutdownHook(new Thread(container::stop));
            return container;
        }
    }

    static void validateLocalUrl(String url) {
        if (!url.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/task2_test")) {
            throw new IllegalStateException("Only an explicit disposable loopback task2_test database is allowed");
        }
    }

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) throws SQLException {
        if (System.getenv("TASK2_TEST_DB_URL") != null) { validateLocalUrl(URL); }
        else { URL = ContainerDatabase.INSTANCE.getJdbcUrl(); }
        Flyway flyway = Flyway.configure().dataSource(URL, "task2_migrator", "")
                .defaultSchema("public").load();
        flyway.migrate();
        assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
        assertThat(flyway.migrate().migrationsExecuted).isZero();
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("GRANT USAGE ON SCHEMA public TO task2_runtime");
            statement.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.sessions, "
                    + "public.projects, public.tasks TO task2_runtime");
        }
        registry.add("spring.datasource.url", () -> URL);
        registry.add("spring.datasource.username", () -> "task2_runtime");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.flyway.url", () -> URL);
        registry.add("spring.flyway.user", () -> "task2_migrator");
        registry.add("spring.flyway.password", () -> "");
    }

    protected static Connection adminConnection() throws SQLException {
        return DriverManager.getConnection(URL, "task2_admin", "");
    }

}
