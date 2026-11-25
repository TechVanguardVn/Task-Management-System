package com.tanseng2027.task_management.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Date;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.tanseng2027.task_management.entity.RevokedToken;
import com.tanseng2027.task_management.repository.RevokedTokenRepository;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceTest {

    private static final String TOKEN = "header.payload.signature";
    // SHA-256 của "header.payload.signature" (tính bằng: printf '%s' "header.payload.signature" | sha256sum)
    private static final String TOKEN_SHA256 = "256d04db4e5e4ac308751ed0885b722b758630567c53a7125ed9fbd068e5c3f6";

    @Mock
    private RevokedTokenRepository revokedTokenRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private TokenBlacklistService tokenBlacklistService;

    @Test
    @DisplayName("Thu hồi token → lưu SHA-256 (64 ký tự hex), không lưu token gốc, kèm thời điểm hết hạn")
    void revoke_storesHashNotRawToken() {
        when(revokedTokenRepository.existsByTokenHash(anyString())).thenReturn(false);
        when(jwtService.extractExpiration(TOKEN)).thenReturn(new Date(System.currentTimeMillis() + 3_600_000));

        tokenBlacklistService.revoke(TOKEN);

        ArgumentCaptor<RevokedToken> captor = ArgumentCaptor.forClass(RevokedToken.class);
        verify(revokedTokenRepository).save(captor.capture());
        RevokedToken saved = captor.getValue();
        assertThat(saved.getTokenHash()).isEqualTo(TOKEN_SHA256).isNotEqualTo(TOKEN);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(saved.getRevokedAt()).isNotNull();
    }

    @Test
    @DisplayName("Thu hồi token đã có trong blacklist → không lưu lại lần nữa")
    void revoke_alreadyRevoked_skips() {
        when(revokedTokenRepository.existsByTokenHash(anyString())).thenReturn(true);

        tokenBlacklistService.revoke(TOKEN);

        verify(revokedTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("2 request đăng xuất cùng lúc (trùng UNIQUE) → không ném lỗi")
    void revoke_concurrentDuplicate_isIgnored() {
        when(revokedTokenRepository.existsByTokenHash(anyString())).thenReturn(false);
        when(jwtService.extractExpiration(TOKEN)).thenReturn(new Date());
        when(revokedTokenRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        tokenBlacklistService.revoke(TOKEN); // không ném exception
    }

    @Test
    @DisplayName("isRevoked tra cứu theo SHA-256 của token (cùng cách hash với revoke)")
    void isRevoked_looksUpByHash() {
        when(revokedTokenRepository.existsByTokenHash(TOKEN_SHA256)).thenReturn(true);

        assertThat(tokenBlacklistService.isRevoked(TOKEN)).isTrue();
    }

    @Test
    @DisplayName("Token chưa bị thu hồi → isRevoked = false")
    void isRevoked_notInBlacklist() {
        when(revokedTokenRepository.existsByTokenHash(TOKEN_SHA256)).thenReturn(false);

        assertThat(tokenBlacklistService.isRevoked(TOKEN)).isFalse();
    }

    @Test
    @DisplayName("Dọn token hết hạn → xóa các bản ghi có expiresAt trước thời điểm hiện tại")
    void cleanupExpiredTokens_deletesExpired() {
        when(revokedTokenRepository.deleteExpired(any(LocalDateTime.class))).thenReturn(3);

        tokenBlacklistService.cleanupExpiredTokens();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(revokedTokenRepository).deleteExpired(captor.capture());
        assertThat(captor.getValue()).isBeforeOrEqualTo(LocalDateTime.now());
    }
}
