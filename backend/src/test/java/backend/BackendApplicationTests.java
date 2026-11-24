package backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import backend.repository.AuthRepository;
import backend.security.RlsContext;
import backend.service.ProjectService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
class BackendApplicationTests {

    @MockitoBean private AuthRepository authRepository;
    @MockitoBean private RlsContext rlsContext;
    @MockitoBean private ProjectService projectService;
    @MockitoBean private backend.service.TaskService taskService;
    @MockitoBean private backend.service.DashboardService dashboardService;

    @Test
    void contextLoads() {
    }

}
