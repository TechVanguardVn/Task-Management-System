package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Triển khai dịch vụ lưu trữ Token Blacklist bằng Redis.
 * Sử dụng cơ chế TTL (Time-To-Live) để Redis tự động dọn dẹp các token đã quá hạn,
 * giúp giải phóng bộ nhớ RAM mà không cần viết cron-job dọn dẹp thủ công.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisTokenBlacklistServiceImpl implements TokenBlacklistService {

    private static final String BLACKLIST_KEY_PREFIX = "blacklist:jwt:";
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void blacklistToken(String token, long remainingExpirationMs) {
        if (remainingExpirationMs <= 0) {
            // Token đã tự hết hạn tự nhiên thì không cần lưu vào Redis nữa để tiết kiệm dung lượng
            return;
        }

        try {
            String key = BLACKLIST_KEY_PREFIX + token;
            // Lưu token vào Redis và đặt thời gian sống đúng bằng số milli-giây còn lại của nó
            redisTemplate.opsForValue().set(key, "revoked", remainingExpirationMs, TimeUnit.MILLISECONDS);
            log.info("Đã đưa token vào Redis Blacklist thành công với TTL: {} ms", remainingExpirationMs);
        } catch (Exception ex) {
            // Fallback: Trong trường hợp Redis tạm thời bị gián đoạn, ghi log cảnh báo để hệ thống không bị crash
            log.error("Không thể ghi token vào Redis Blacklist do sự cố kết nối: {}", ex.getMessage());
        }
    }

    @Override
    public boolean isBlacklisted(String token) {
        try {
            String key = BLACKLIST_KEY_PREFIX + token;
            Boolean hasKey = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(hasKey);
        } catch (Exception ex) {
            // Fallback: Nếu Redis gặp sự cố, cho phép token đi qua để tránh gián đoạn dịch vụ toàn hệ thống
            log.warn("Lỗi khi kiểm tra Blacklist trên Redis, tạm thời bỏ qua kiểm tra: {}", ex.getMessage());
            return false;
        }
    }
}
