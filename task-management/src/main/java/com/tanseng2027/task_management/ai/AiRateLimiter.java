package com.tanseng2027.task_management.ai;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.tanseng2027.task_management.ai.AiException.Reason;

@Component
public class AiRateLimiter {

    static final Duration USER_WINDOW = Duration.ofHours(1);
    static final Duration GLOBAL_WINDOW = Duration.ofDays(1);

    private final Map<Long, Deque<Instant>> callsByUser = new ConcurrentHashMap<>();
    private final Deque<Instant> allCalls = new ArrayDeque<>();
    private final AiProperties properties;
    private final Clock clock;

    public AiRateLimiter(AiProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    /** Ghi nhận 1 lần gọi; ném AiException(RATE_LIMITED) nếu user hoặc cả app đã dùng hết lượt. */
    public void acquire(Long userId) {
        Instant now = clock.instant();
        Deque<Instant> userCalls = callsByUser.computeIfAbsent(userId, id -> new ArrayDeque<>());
        // Thứ tự khóa luôn là user → global nên không thể deadlock
        synchronized (userCalls) {
            evictOlderThan(userCalls, now.minus(USER_WINDOW));
            int maxPerHour = properties.maxRequestsPerHour();
            if (userCalls.size() >= maxPerHour) {
                long minutes = minutesUntilFree(userCalls, USER_WINDOW, now);
                throw new AiException(Reason.RATE_LIMITED,
                        "Bạn đã dùng hết %d lượt AI trong 1 giờ, thử lại sau khoảng %d phút".formatted(maxPerHour, minutes));
            }

            synchronized (allCalls) {
                evictOlderThan(allCalls, now.minus(GLOBAL_WINDOW));
                int maxPerDay = properties.maxRequestsPerDay();
                if (maxPerDay > 0 && allCalls.size() >= maxPerDay) {
                    throw new AiException(Reason.RATE_LIMITED,
                            "Tính năng AI đã hết lượt dùng chung trong hôm nay, bạn vui lòng nhập tay hoặc thử lại sau");
                }
                allCalls.addLast(now);
            }
            userCalls.addLast(now);
        }
    }

    private static void evictOlderThan(Deque<Instant> calls, Instant threshold) {
        while (!calls.isEmpty() && !calls.peekFirst().isAfter(threshold)) {
            calls.pollFirst();
        }
    }

    private static long minutesUntilFree(Deque<Instant> calls, Duration window, Instant now) {
        return Duration.between(now, calls.peekFirst().plus(window)).toMinutes() + 1;
    }
}
