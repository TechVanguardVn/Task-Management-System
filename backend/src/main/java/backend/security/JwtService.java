package backend.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import javax.crypto.spec.SecretKeySpec;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Component;

@Component
public class JwtService {
    private final JwtEncoder encoder;
    private final NimbusJwtDecoder decoder;
    private final String issuer;
    private final String audience;
    private final Duration lifetime;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration}") long expirationMillis,
                      @Value("${app.jwt.issuer}") String issuer,
                      @Value("${app.jwt.audience}") String audience) {
        byte[] key;
        try {
            key = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET must contain Base64-encoded random key material");
        }
        if (key.length < 32) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes");
        }
        if (expirationMillis < 60000 || expirationMillis > 3600000) {
            throw new IllegalStateException("JWT_EXPIRATION must be between 60000 and 3600000 milliseconds");
        }
        this.issuer = issuer;
        this.audience = audience;
        this.lifetime = Duration.ofMillis(expirationMillis);
        var secretKey = new SecretKeySpec(key, "HmacSHA256");
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
        this.decoder = NimbusJwtDecoder.withSecretKey(secretKey).macAlgorithm(MacAlgorithm.HS256).build();
        this.decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(Duration.ZERO), new JwtIssuerValidator(issuer), this::validateClaims));
    }

    public IssuedToken issue(UUID userId, UUID sessionId) {
        Instant now = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        Instant expiresAt = now.plus(lifetime).truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        var claims = JwtClaimsSet.builder().issuer(issuer).audience(List.of(audience))
                .subject(userId.toString()).id(sessionId.toString())
                .issuedAt(now).notBefore(now).expiresAt(expiresAt).build();
        String token = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).type("JWT").build(), claims)).getTokenValue();
        return new IssuedToken(token, expiresAt);
    }

    public AuthPrincipal verify(String token) {
        Jwt jwt = decoder.decode(token);
        return new AuthPrincipal(UUID.fromString(jwt.getSubject()), UUID.fromString(jwt.getId()));
    }

    private OAuth2TokenValidatorResult validateClaims(Jwt jwt) {
        try {
            UUID.fromString(jwt.getSubject());
            UUID.fromString(jwt.getId());
            Instant issued = jwt.getIssuedAt();
            Instant expiry = jwt.getExpiresAt();
            Instant now = Instant.now();
            if (issued != null && expiry != null && jwt.getAudience().contains(audience)
                    && !issued.isAfter(now) && expiry.isAfter(now) && expiry.isAfter(issued)
                    && Duration.between(issued, expiry).compareTo(lifetime) <= 0
                    && "JWT".equals(jwt.getHeaders().get("typ"))) {
                return OAuth2TokenValidatorResult.success();
            }
        } catch (RuntimeException ignored) {
            // Invalid/missing claim values are never returned or logged.
        }
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Invalid token claims", null));
    }

    public record IssuedToken(String value, Instant expiresAt) {
        @Override public String toString() { return "IssuedToken[REDACTED]"; }
    }
}
