package backend.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class TestDatabaseSafetyTests {
    @Test
    void onlyExactLoopbackDisposableDatabaseOverridesAreAccepted() {
        assertThatCode(() -> PostgresTestSupport.validateLocalUrl("jdbc:postgresql://127.0.0.1:55439/task2_test"))
                .doesNotThrowAnyException();
        assertThatCode(() -> PostgresTestSupport.validateLocalUrl("jdbc:postgresql://localhost:5432/task2_test"))
                .doesNotThrowAnyException();
        for (String url : new String[]{"jdbc:postgresql://example.supabase.co:5432/postgres",
                "jdbc:postgresql://127.0.0.1:5432/postgres", "jdbc:postgresql://remote.example:5432/task2_test",
                "jdbc:postgresql://localhost:5432/task2_test?options=-c%20search_path=public"}) {
            assertThatThrownBy(() -> PostgresTestSupport.validateLocalUrl(url)).isInstanceOf(IllegalStateException.class);
        }
    }
}
