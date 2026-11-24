package backend.persistence;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Supplier;

import backend.entity.Project;
import backend.entity.Session;
import backend.entity.Task;
import backend.enums.ProjectStatus;
import backend.enums.TaskPriority;
import backend.enums.TaskStatus;
import backend.repository.ProjectRepository;
import backend.repository.SessionRepository;
import backend.repository.TaskRepository;
import backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.*;

/** Opt-in integration tests: only a disposable, loopback task2_test database is accepted. */
@SpringBootTest(properties = "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=")
@EnabledIf("backend.support.PostgresTestSupport#databaseAvailable")
class PostgresPersistenceTests extends backend.support.PostgresTestSupport {
    private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID PROJECT = UUID.fromString("00000000-0000-0000-0000-000000000011");
    private static final UUID SECOND_PROJECT = UUID.fromString("00000000-0000-0000-0000-000000000012");
    private static final UUID OTHER_PROJECT = UUID.fromString("00000000-0000-0000-0000-000000000013");
    private static final UUID TASK = UUID.fromString("00000000-0000-0000-0000-000000000021");
    private static final UUID SECOND_TASK = UUID.fromString("00000000-0000-0000-0000-000000000022");

    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private TaskRepository tasks;
    @Autowired private SessionRepository sessions;

    @BeforeEach
    void fixtures() throws SQLException {
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("TRUNCATE public.users CASCADE");
            statement.execute("INSERT INTO public.users(id,email,name,password_hash) VALUES "
                    + "('" + OWNER + "','owner@example.invalid','Owner','not-a-login-hash'),"
                    + "('" + OTHER + "','other@example.invalid','Other','not-a-login-hash')");
            statement.execute("INSERT INTO public.projects(id,owner_id,name) VALUES "
                    + "('" + PROJECT + "','" + OWNER + "','First'),"
                    + "('" + SECOND_PROJECT + "','" + OWNER + "','Second'),"
                    + "('" + OTHER_PROJECT + "','" + OTHER + "','Other')");
            statement.execute("INSERT INTO public.tasks(id,project_id,title) VALUES "
                    + "('" + TASK + "','" + PROJECT + "','First task'),"
                    + "('" + SECOND_TASK + "','" + SECOND_PROJECT + "','Second task')");
        }
    }

    private <T> T asOwner(Supplier<T> action) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            jdbc.queryForObject("SELECT set_config('app.current_user_id', ?, true)", String.class, OWNER.toString());
            return action.get();
        });
    }

    @Test
    void jpaMappingsValidateAndRoundTripNativeEnumsUuidsAndGeneratedTimestamps() {
        UUID id = asOwner(() -> {
            Project project = new Project(users.getReferenceById(OWNER), "JPA project");
            project.setStatus(ProjectStatus.ACTIVE);
            project = projects.saveAndFlush(project);
            assertThat(project.getId()).isNotNull();
            assertThat(project.getCreatedAt()).isNotNull();
            assertThat(project.getUpdatedAt()).isNotNull();
            Task task = new Task(project, "JPA task");
            task.setPriority(TaskPriority.HIGH);
            task.setStatus(TaskStatus.DONE);
            task = tasks.saveAndFlush(task);
            assertThat(task.getCompletedAt()).isNotNull();
            Session session = sessions.saveAndFlush(new Session(users.getReferenceById(OWNER),
                    "test-token-hash", Instant.now().plusSeconds(3600)));
            assertThat(session.getCreatedAt()).isNotNull();
            assertThat(sessions.findByIdAndUser_Id(session.getId(), OWNER)).isPresent();
            return task.getId();
        });
        asOwner(() -> {
            Task task = tasks.findByIdAndProject_Owner_Id(id, OWNER).orElseThrow();
            assertThat(task.getStatus()).isEqualTo(TaskStatus.DONE);
            assertThat(task.getPriority()).isEqualTo(TaskPriority.HIGH);
            task.setStatus(TaskStatus.IN_PROGRESS);
            tasks.flush();
            assertThat(task.getCompletedAt()).isNull();
            return null;
        });
    }

    @Test
    void rlsDeniesMissingIdentityAndOtherOwnersAndResetsOnPoolReuse() {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM public.projects", Long.class)).isZero();
        asOwner(() -> {
            assertThat(projects.count()).isEqualTo(2);
            assertThat(users.count()).isEqualTo(1);
            assertThat(projects.findById(OTHER_PROJECT)).isEmpty();
            assertThat(tasks.findByIdAndProject_Owner_Id(TASK, OTHER)).isEmpty();
            return null;
        });
        assertThat(jdbc.queryForObject("SELECT count(*) FROM public.projects", Long.class)).isZero();
        assertThatThrownBy(() -> asOwner(() -> projects.saveAndFlush(
                new Project(users.getReferenceById(OTHER), "Forbidden")))).hasRootCauseInstanceOf(SQLException.class);
    }

    @Test
    void forcedRlsAlsoAppliesToNonSuperuserTableOwner() throws SQLException {
        try (Connection owner = DriverManager.getConnection(URL, "task2_migrator", "");
             var statement = owner.createStatement();
             var result = statement.executeQuery("SELECT count(*) FROM public.users")) {
            assertThat(result.next()).isTrue();
            assertThat(result.getLong(1)).isZero();
        }
    }

    @Test
    void allMutableTimestampedTablesUseDatabaseTimeAndPreserveCreatedAt() {
        asOwner(() -> {
            for (String table : new String[]{"users", "projects", "tasks"}) {
                String column = table.equals("tasks") ? "title" : "name";
                jdbc.update("UPDATE public." + table + " SET " + column + " = " + column
                        + " || ' edited', updated_at = '2000-01-01', created_at = '2000-01-01'");
                assertThat(jdbc.queryForObject("SELECT bool_and(updated_at > '2000-01-01' AND created_at > '2000-01-01')"
                        + " FROM public." + table, Boolean.class)).isTrue();
            }
            return null;
        });
    }

    @Test
    void doneTimestampIsStableUntilReopenedAndCannotBeSpoofed() {
        asOwner(() -> {
            jdbc.update("UPDATE public.tasks SET status='DONE', completed_at='2000-01-01' WHERE id=?", TASK);
            Instant completed = jdbc.queryForObject("SELECT completed_at FROM public.tasks WHERE id=?",
                    (rs, row) -> rs.getTimestamp(1).toInstant(), TASK);
            assertThat(completed).isAfter(Instant.parse("2000-01-01T00:00:00Z"));
            jdbc.update("UPDATE public.tasks SET completed_at='2001-01-01' WHERE id=?", TASK);
            Instant unchanged = jdbc.queryForObject("SELECT completed_at FROM public.tasks WHERE id=?",
                    (rs, row) -> rs.getTimestamp(1).toInstant(), TASK);
            assertThat(unchanged).isEqualTo(completed);
            jdbc.update("UPDATE public.tasks SET status='TODO' WHERE id=?", TASK);
            assertThat(jdbc.queryForObject("SELECT completed_at IS NULL FROM public.tasks WHERE id=?", Boolean.class, TASK)).isTrue();
            return null;
        });
    }

    @Test
    void archivedProjectsRejectInsertsUpdatesAndMovesInBothDirections() throws SQLException {
        try (Connection connection = runtimeConnection()) {
            execute(connection, "UPDATE public.projects SET status='ARCHIVED' WHERE id='" + PROJECT + "'");
            connection.commit();
        }
        assertSqlState("23514", "INSERT INTO public.tasks(project_id,title) VALUES ('" + PROJECT + "','Forbidden')");
        assertSqlState("23514", "UPDATE public.tasks SET title='Forbidden' WHERE id='" + TASK + "'");
        assertSqlState("23514", "UPDATE public.tasks SET project_id='" + SECOND_PROJECT + "' WHERE id='" + TASK + "'");
        assertSqlState("23514", "UPDATE public.tasks SET project_id='" + PROJECT + "' WHERE id='" + SECOND_TASK + "'");
    }

    @Test
    void constraintsRejectInvalidValuesAndForeignKeys() throws SQLException {
        assertSqlState("23514", "UPDATE public.users SET email='UNNORMALIZED@example.invalid' WHERE id='" + OWNER + "'");
        assertSqlState("23505", "INSERT INTO public.users(id,email,name,password_hash) VALUES ('" + OWNER + "','owner@example.invalid','X','hash')");
        assertSqlState("22001", "UPDATE public.tasks SET title=repeat('x',256) WHERE id='" + TASK + "'");
        assertSqlState("23514", "UPDATE public.tasks SET title='  ' WHERE id='" + TASK + "'");
        assertSqlState("23514", "UPDATE public.tasks SET description=repeat('x',10001) WHERE id='" + TASK + "'");
        assertSqlState("23514", "UPDATE public.projects SET start_date='2026-02-02', due_date='2026-01-01' WHERE id='" + PROJECT + "'");
        assertSqlState("23514", "INSERT INTO public.sessions(user_id,token_hash,expires_at) VALUES ('" + OWNER + "','hash','2000-01-01')");
        try (Connection admin = adminConnection()) {
            assertThatThrownBy(() -> execute(admin, "INSERT INTO public.tasks(project_id,title) VALUES (gen_random_uuid(),'Missing parent')"))
                    .isInstanceOfSatisfying(SQLException.class, error -> assertThat(error.getSQLState()).isEqualTo("23503"));
        }
    }

    @Test
    void userDeletionCascadesToProjectsTasksAndSessions() {
        asOwner(() -> {
            sessions.saveAndFlush(new Session(users.getReferenceById(OWNER), "cascade-token", Instant.now().plusSeconds(3600)));
            users.deleteById(OWNER);
            users.flush();
            assertThat(projects.count()).isZero();
            assertThat(tasks.count()).isZero();
            assertThat(sessions.count()).isZero();
            return null;
        });
    }

    @Test
    void opposingTaskMovesFailFastInsteadOfWaitingForParentLocks() throws SQLException {
        try (Connection first = runtimeConnection(); Connection second = runtimeConnection()) {
            execute(first, "UPDATE public.tasks SET project_id='" + SECOND_PROJECT + "' WHERE id='" + TASK + "'");
            assertThatThrownBy(() -> execute(second, "UPDATE public.tasks SET project_id='" + PROJECT + "' WHERE id='" + SECOND_TASK + "'"))
                    .isInstanceOfSatisfying(SQLException.class, error -> assertThat(error.getSQLState()).isEqualTo("55P03"));
            second.rollback();
            first.commit();
        }
    }

    @Test
    void archiveWinsConcurrentTaskWriteThenRetrySeesArchivedStatus() throws SQLException {
        try (Connection archive = runtimeConnection(); Connection writer = runtimeConnection()) {
            execute(archive, "UPDATE public.projects SET status='ARCHIVED' WHERE id='" + PROJECT + "'");
            assertThatThrownBy(() -> execute(writer, "UPDATE public.tasks SET title='Race' WHERE id='" + TASK + "'"))
                    .isInstanceOfSatisfying(SQLException.class, error -> assertThat(error.getSQLState()).isEqualTo("55P03"));
            writer.rollback();
            archive.commit();
        }
        assertSqlState("23514", "UPDATE public.tasks SET title='Retry' WHERE id='" + TASK + "'");
    }

    @Test
    void taskWritePreventsArchiveUntilTransactionCompletes() throws SQLException {
        try (Connection writer = runtimeConnection(); Connection archive = runtimeConnection()) {
            execute(writer, "UPDATE public.tasks SET title='Race' WHERE id='" + TASK + "'");
            execute(archive, "SET LOCAL lock_timeout='100ms'");
            assertThatThrownBy(() -> execute(archive, "UPDATE public.projects SET status='ARCHIVED' WHERE id='" + PROJECT + "'"))
                    .isInstanceOfSatisfying(SQLException.class, error -> assertThat(error.getSQLState()).isEqualTo("55P03"));
            archive.rollback();
            writer.commit();
        }
        try (Connection archive = runtimeConnection()) {
            execute(archive, "UPDATE public.projects SET status='ARCHIVED' WHERE id='" + PROJECT + "'");
            archive.commit();
        }
    }

    private static Connection runtimeConnection() throws SQLException {
        Connection connection = DriverManager.getConnection(URL, "task2_runtime", "");
        connection.setAutoCommit(false);
        execute(connection, "SET LOCAL app.current_user_id='" + OWNER + "'");
        execute(connection, "SET LOCAL statement_timeout='2000ms'");
        return connection;
    }

    private static void execute(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static void assertSqlState(String state, String sql) throws SQLException {
        try (Connection connection = runtimeConnection()) {
            assertThatThrownBy(() -> execute(connection, sql)).isInstanceOfSatisfying(SQLException.class,
                    error -> assertThat(error.getSQLState()).isEqualTo(state));
        }
    }
}
