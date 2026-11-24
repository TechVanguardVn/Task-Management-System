package backend.security;

import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RlsContext {
    private final JdbcTemplate jdbc;

    @Transactional(propagation = Propagation.MANDATORY)
    public void asUser(UUID userId) {
        set("app.login_email", "");
        set("app.current_user_id", userId.toString());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void forLogin(String email) {
        set("app.current_user_id", "");
        set("app.login_email", email);
    }

    private void set(String name, String value) {
        jdbc.queryForObject("SELECT set_config(?, ?, true)", String.class, name, value);
    }
}
