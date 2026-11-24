package backend.security;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import javax.crypto.spec.SecretKeySpec;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTests {
    private static final String SECRET = Base64.getEncoder().encodeToString(new byte[32]);
    private final JwtService jwt = new JwtService(SECRET, 900000, "test-issuer", "test-api");

    @Test
    void validTokenRoundTripsAndTamperingFails() {
        UUID user = UUID.randomUUID();
        UUID session = UUID.randomUUID();
        var token = jwt.issue(user, session);
        assertThat(jwt.verify(token.value())).isEqualTo(new AuthPrincipal(user, session));
        String[] parts = token.value().split("\\.");
        String tampered = parts[0] + "." + parts[1] + ".AAAA";
        assertThatThrownBy(() -> jwt.verify(tampered)).isInstanceOf(JwtException.class);
        assertThat(token.toString()).doesNotContain(token.value());
    }

    @Test
    void expiredWrongIssuerWrongAudienceAndMissingClaimsAreRejected() {
        Instant now = Instant.now();
        reject(claims(now.minusSeconds(120)).expiresAt(now.minusSeconds(60)).build());
        reject(claims(now).issuer("wrong").build());
        reject(claims(now).audience(List.of("wrong")).build());
        reject(claims(now).subject("not-a-uuid").build());
        reject(claims(now).id("not-a-uuid").build());
        reject(JwtClaimsSet.builder().issuer("test-issuer").subject(UUID.randomUUID().toString()).build());
        reject(claims(now.plusSeconds(60)).build());
        reject(claims(now).expiresAt(now.plusSeconds(3600)).build());
    }

    @Test
    void tokensSignedWithAnotherKeyAndUnsignedTokensAreRejected() {
        byte[] other = new byte[32];
        new java.security.SecureRandom().nextBytes(other);
        var otherJwt = new JwtService(Base64.getEncoder().encodeToString(other), 900000, "test-issuer", "test-api");
        String otherToken = otherJwt.issue(UUID.randomUUID(), UUID.randomUUID()).value();
        assertThatThrownBy(() -> jwt.verify(otherToken)).isInstanceOf(JwtException.class);
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\"}".getBytes());
        assertThatThrownBy(() -> jwt.verify(header + ".e30.")).isInstanceOf(JwtException.class);
    }

    @Test
    void insecureConfigurationIsRejectedWithoutEchoingSecret() {
        assertThatThrownBy(() -> new JwtService("not-base64!", 900000, "issuer", "api"))
                .isInstanceOf(IllegalStateException.class).hasMessageNotContaining("not-base64!");
        assertThatThrownBy(() -> new JwtService("dGVzdA==", 900000, "issuer", "api"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new JwtService(SECRET, 3600001, "issuer", "api"))
                .isInstanceOf(IllegalStateException.class);
    }

    private JwtClaimsSet.Builder claims(Instant issued) {
        return JwtClaimsSet.builder().issuer("test-issuer").audience(List.of("test-api"))
                .subject(UUID.randomUUID().toString()).id(UUID.randomUUID().toString())
                .issuedAt(issued).notBefore(issued).expiresAt(issued.plusSeconds(900));
    }

    private void reject(JwtClaimsSet claims) {
        var encoder = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(new byte[32], "HmacSHA256")));
        String token = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).type("JWT").build(), claims)).getTokenValue();
        assertThatThrownBy(() -> jwt.verify(token)).isInstanceOf(JwtException.class);
    }
}
