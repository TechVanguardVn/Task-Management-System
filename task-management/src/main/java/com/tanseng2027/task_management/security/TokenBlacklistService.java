package com.tanseng2027.task_management.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.tanseng2027.task_management.entity.RevokedToken;
import com.tanseng2027.task_management.repository.RevokedTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtService jwtService;

    /**
     * Thu hồi token. Gọi nhiều lần với cùng token vẫn an toàn.
     */
    public void revoke(String token) {
        String tokenHash = hash(token);
        if (revokedTokenRepository.existsByTokenHash(tokenHash)) {
            return;
        }

        LocalDateTime expiresAt = LocalDateTime.ofInstant(
                jwtService.extractExpiration(token).toInstant(), ZoneId.systemDefault());
        try {
            revokedTokenRepository.save(RevokedToken.builder()
                    .tokenHash(tokenHash)
                    .expiresAt(expiresAt)
                    .revokedAt(LocalDateTime.now())
                    .build());
        } catch (DataIntegrityViolationException e) {
            // 2 request đăng xuất cùng lúc với cùng token: bản ghi đã có rồi, coi như thành công
        }
    }

    public boolean isRevoked(String token) {
        return revokedTokenRepository.existsByTokenHash(hash(token));
    }

    // Mỗi giờ dọn các token đã hết hạn để bảng không phình to
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        int deleted = revokedTokenRepository.deleteExpired(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Đã xóa {} token hết hạn khỏi blacklist", deleted);
        }
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 luôn có sẵn trong mọi JVM
            throw new IllegalStateException(e);
        }
    }
}
