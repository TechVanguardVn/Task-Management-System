package com.tanseng2027.task_management.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.tanseng2027.task_management.entity.User;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

class JwtServiceTest {

    private static final String SECRET = Base64.getEncoder()
            .encodeToString("unit-test-secret-key-that-is-at-least-32-bytes".getBytes());

    private JwtService jwtService;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        jwtService = newJwtService(SECRET, 60_000);
        alice = User.builder().id(1L).email("alice@example.com").password("x").fullName("Alice").build();
        bob = User.builder().id(2L).email("bob@example.com").password("x").fullName("Bob").build();
    }

    private static JwtService newJwtService(String secret, long expirationMs) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secretKey", secret);
        ReflectionTestUtils.setField(service, "jwtExpiration", expirationMs);
        return service;
    }

    @Test
    @DisplayName("Token tạo ra chứa email của user và hợp lệ với chính user đó")
    void generateToken_validForSameUser() {
        String token = jwtService.generateToken(alice);

        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@example.com");
        assertThat(jwtService.isTokenValid(token, alice)).isTrue();
    }

    @Test
    @DisplayName("Token của Alice không hợp lệ với Bob")
    void token_invalidForOtherUser() {
        String token = jwtService.generateToken(alice);

        assertThat(jwtService.isTokenValid(token, bob)).isFalse();
    }

    @Test
    @DisplayName("Token bị sửa (sai chữ ký) → ném JwtException")
    void tamperedToken_throws() {
        String token = jwtService.generateToken(alice);
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThatThrownBy(() -> jwtService.extractUsername(tampered)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Token ký bằng secret khác → ném JwtException")
    void tokenFromOtherSecret_throws() {
        String otherSecret = Base64.getEncoder()
                .encodeToString("another-secret-key-that-is-also-32-bytes-long!".getBytes());
        String foreignToken = newJwtService(otherSecret, 60_000).generateToken(alice);

        assertThatThrownBy(() -> jwtService.extractUsername(foreignToken)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Token hết hạn → ném ExpiredJwtException")
    void expiredToken_throws() {
        String expired = newJwtService(SECRET, -1_000).generateToken(alice);

        assertThatThrownBy(() -> jwtService.isTokenValid(expired, alice)).isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("Secret đủ dài → khởi động bình thường")
    void validateSecret_ok() {
        jwtService.validateSecret(); // không ném exception
    }

    @Test
    @DisplayName("Secret ngắn hơn 32 byte → báo lỗi ngay khi khởi động")
    void validateSecret_tooShort_throws() {
        JwtService weak = newJwtService(Base64.getEncoder().encodeToString("short".getBytes()), 60_000);

        assertThatThrownBy(weak::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("quá ngắn");
    }
}
