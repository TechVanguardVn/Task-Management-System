package backend.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import backend.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Explicit SQL keeps credential lookup and session persistence inside the RLS transaction. */
@Repository
@RequiredArgsConstructor
public class AuthRepository {
    private final JdbcTemplate jdbc;

    public Optional<Credentials> findCredentials(String email) {
        return jdbc.query("SELECT id, email, name, password_hash FROM public.users WHERE email = ?",
                (rs, row) -> new Credentials(new UserResponse(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("name")), rs.getString("password_hash")), email)
                .stream().findFirst();
    }

    public void createUser(UserResponse user, String passwordHash) {
        jdbc.update("INSERT INTO public.users(id,email,name,password_hash) VALUES (?,?,?,?)",
                user.id(), user.email(), user.name(), passwordHash);
    }

    public Optional<UserResponse> findUser(UUID userId) {
        return jdbc.query("SELECT id,email,name FROM public.users WHERE id=?",
                (rs, row) -> new UserResponse(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("name")), userId).stream().findFirst();
    }

    public void createSession(UUID sessionId, UUID userId, String tokenHash, Instant expiresAt) {
        jdbc.update("INSERT INTO public.sessions(id,user_id,token_hash,expires_at) VALUES (?,?,?,?)",
                sessionId, userId, tokenHash, Timestamp.from(expiresAt));
    }

    public boolean isActive(UUID sessionId, UUID userId, String tokenHash) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM public.sessions
                WHERE id=? AND user_id=? AND token_hash=? AND revoked_at IS NULL AND expires_at > clock_timestamp())
                """, Boolean.class, sessionId, userId, tokenHash));
    }

    public void revoke(UUID sessionId, UUID userId) {
        jdbc.update("UPDATE public.sessions SET revoked_at=clock_timestamp() WHERE id=? AND user_id=? AND revoked_at IS NULL",
                sessionId, userId);
    }

    public record Credentials(UserResponse user, String passwordHash) {
        @Override public String toString() { return "Credentials[REDACTED]"; }
    }
}
