package backend.security;

import java.sql.Connection;
import java.util.Map;
import java.util.UUID;

import backend.support.PostgresTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "app.jwt.secret=dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=")
@AutoConfigureMockMvc
@EnabledIf("backend.support.PostgresTestSupport#databaseAvailable")
class AuthIntegrationTests extends PostgresTestSupport {
    private static final String PASSWORD = "correct horse battery staple";
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private PasswordEncoder passwords;
    @Autowired private JwtService jwt;

    @BeforeEach
    void cleanDatabase() throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("TRUNCATE public.users CASCADE");
        }
    }

    @Test
    void registrationNormalizesAndHashesCredentialsAndMeUsesPrincipal() throws Exception {
        JsonNode response = register("  Alice@Example.COM  ", " Alice ", PASSWORD);
        assertThat(response.path("user").path("email").asText()).isEqualTo("alice@example.com");
        assertThat(response.path("user").path("name").asText()).isEqualTo("Alice");
        assertThat(response.toString()).doesNotContain("password", "tokenHash", "token_hash");
        String token = response.path("accessToken").asText();
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.tokenHash").doesNotExist())
                .andExpect(header().doesNotExist("Set-Cookie"));
        try (Connection admin = adminConnection(); var statement = admin.createStatement();
             var result = statement.executeQuery("SELECT password_hash, token_hash FROM public.users JOIN public.sessions ON users.id=sessions.user_id")) {
            assertThat(result.next()).isTrue();
            assertThat(passwords.matches(PASSWORD, result.getString(1))).isTrue();
            assertThat(result.getString(1)).startsWith("$2a$12$");
            assertThat(result.getString(2)).isEqualTo(TokenHash.sha256(token)).hasSize(64);
        }
    }

    @Test
    void duplicateNormalizedEmailReturnsConflictAndOnlyOneUser() throws Exception {
        register("alice@example.com", "Alice", PASSWORD);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", " ALICE@example.com ", "name", "Other", "password", PASSWORD))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.status").value(409));
        assertThat(count("users")).isEqualTo(1);
        assertThat(count("sessions")).isEqualTo(1);
    }

    @Test
    void loginCreatesIndependentSessionsAndLogoutRevokesOnlyCurrentToken() throws Exception {
        String first = register("alice@example.com", "Alice", PASSWORD).path("accessToken").asText();
        String second = login(" ALICE@EXAMPLE.COM ", PASSWORD).path("accessToken").asText();
        assertThat(first).isNotEqualTo(second);
        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + first))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + first))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + first))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + second))
                .andExpect(status().isOk());
        try (Connection admin = adminConnection(); var statement = admin.createStatement();
             var result = statement.executeQuery("SELECT count(*) FROM public.sessions WHERE revoked_at IS NOT NULL")) {
            result.next();
            assertThat(result.getLong(1)).isEqualTo(1);
        }
    }

    @Test
    void wrongPasswordAndUnknownEmailHaveSameGenericUnauthorizedResponse() throws Exception {
        register("alice@example.com", "Alice", PASSWORD);
        for (String email : new String[]{"alice@example.com", "unknown@example.com"}) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(Map.of("email", email, "password", "wrong"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }
        assertThat(count("sessions")).isEqualTo(1);
    }

    @Test
    void signedButExpiredAccessTokenIsUnauthorized() throws Exception {
        byte[] key = java.util.Base64.getDecoder().decode("dGVzdC1vbmx5LXNlY3JldC1rZXktMzItYnl0ZXMtbG9uZyE=");
        var encoder = new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(
                new com.nimbusds.jose.jwk.source.ImmutableSecret<>(new javax.crypto.spec.SecretKeySpec(key, "HmacSHA256")));
        var now = java.time.Instant.now();
        var claims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder()
                .issuer("task-management-system").audience(java.util.List.of("task-management-api"))
                .subject(UUID.randomUUID().toString()).id(UUID.randomUUID().toString())
                .issuedAt(now.minusSeconds(120)).notBefore(now.minusSeconds(120)).expiresAt(now.minusSeconds(60)).build();
        String token = encoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(
                org.springframework.security.oauth2.jwt.JwsHeader.with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256)
                        .type("JWT").build(), claims)).getTokenValue();
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void invalidAndMultibyteOverlongPasswordsAndBlankInputsAreRejected() throws Exception {
        for (String password : new String[]{"short", "é".repeat(37), " ".repeat(12), "valid-length\0password"}) {
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(Map.of("email", "alice@example.com", "name", "Alice", "password", password))))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.validationErrors[0].field").value("password"));
        }
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "invalid", "name", "  ", "password", PASSWORD))))
                .andExpect(status().isBadRequest());
        assertThat(count("users")).isZero();
    }

    @Test
    void missingMalformedAndUnpersistedTokensAreUnauthorizedAndBusinessRoutesForbidden() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout")).andExpect(status().isUnauthorized());
        for (String header : new String[]{"Bearer malformed", "Basic abc", "Bearer " + jwt.issue(UUID.randomUUID(), UUID.randomUUID()).value()}) {
            mvc.perform(get("/api/auth/me").header("Authorization", header))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.status").value(401));
        }
        String token = register("alice@example.com", "Alice", PASSWORD).path("accessToken").asText();
        mvc.perform(get("/api/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
        mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void databaseSessionExpiryAndTokenHashMismatchInvalidateOtherwiseValidJwt() throws Exception {
        String token = register("alice@example.com", "Alice", PASSWORD).path("accessToken").asText();
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("UPDATE public.sessions SET token_hash='different-hash'");
        }
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        String fresh = login("alice@example.com", PASSWORD).path("accessToken").asText();
        try (Connection admin = adminConnection(); var statement = admin.createStatement()) {
            statement.execute("UPDATE public.sessions SET created_at=clock_timestamp()-interval '2 hours', expires_at=clock_timestamp()-interval '1 hour'");
        }
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + fresh)).andExpect(status().isUnauthorized());
    }

    @Test
    void loginLookupPolicyExposesOnlyRequestedUserAndNoMutationPrivileges() throws Exception {
        register("alice@example.com", "Alice", PASSWORD);
        register("bob@example.com", "Bob", PASSWORD);
        try (Connection runtime = java.sql.DriverManager.getConnection(URL, "task2_runtime", "");
             var statement = runtime.createStatement()) {
            runtime.setAutoCommit(false);
            statement.execute("SET LOCAL app.login_email='alice@example.com'");
            try (var result = statement.executeQuery("SELECT count(*) FROM public.users")) {
                result.next();
                assertThat(result.getLong(1)).isEqualTo(1);
            }
            assertThat(statement.executeUpdate("UPDATE public.users SET name='Forbidden'")).isZero();
            runtime.commit();
            try (var result = statement.executeQuery("SELECT count(*) FROM public.users")) {
                result.next();
                assertThat(result.getLong(1)).isZero();
            }
        }
    }

    private JsonNode register(String email, String name, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "name", name, "password", password))))
                .andExpect(status().isCreated()).andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }

    private JsonNode login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }

    private long count(String table) throws Exception {
        try (Connection admin = adminConnection(); var statement = admin.createStatement();
             var result = statement.executeQuery("SELECT count(*) FROM public." + table)) {
            result.next();
            return result.getLong(1);
        }
    }
}
