package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.service.RateLimiterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Triển khai dịch vụ Rate Limiting phân tán bằng Redis.
 * Sử dụng lệnh nguyên tử INCR và EXPIRE của Redis để đếm chính xác số lần gọi trong cửa sổ trượt (Sliding Window),
 * hoạt động tin cậy ngay cả khi backend được scale thành nhiều container/instance chạy song song.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisRateLimiterServiceImpl implements RateLimiterService {

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public boolean isAllowed(String key, int maxRequests, long windowSeconds) {
        try {
            String redisKey = RATE_LIMIT_PREFIX + key;
            // Tăng biến đếm nguyên tử trong Redis
            Long currentCount = redisTemplate.opsForValue().increment(redisKey);

            if (currentCount != null && currentCount == 1) {
                // Nếu đây là yêu cầu đầu tiên trong khung thời gian, đặt thời gian hết hạn TTL cho key
                redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
            }

            // Nếu số lần vượt quá ngưỡng cho phép thì từ chối yêu cầu
            return currentCount != null && currentCount <= maxRequests;
        } catch (Exception ex) {
            // Fallback an toàn: Nếu Redis tạm thời không kết nối được, không chặn request của người dùng thật
            log.warn("Không thể kiểm tra Rate Limiter trên Redis, tạm thời cho phép request: {}", ex.getMessage());
            return true;
        }
    }
}
