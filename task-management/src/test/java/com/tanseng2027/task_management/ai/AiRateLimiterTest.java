package com.tanseng2027.task_management.ai;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AiRateLimiterTest {

    /** Đồng hồ chỉnh được thời gian để test cửa sổ 1 giờ. */
    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-11-24T02:00:00Z");

        void advance(Duration d) { now = now.plus(d); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    private MutableClock clock;
    private AiRateLimiter limiter;

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        AiProperties props = new AiProperties("k", "http://x", "m", "r", Duration.ofSeconds(5), 3, 0);
        limiter = new AiRateLimiter(props, clock);
    }

    @Test
    @DisplayName("Tối đa 3 lần / giờ: lần thứ 4 bị chặn kèm số phút phải đợi")
    void blocksAfterLimit() {
        limiter.acquire(1L);
        limiter.acquire(1L);
        limiter.acquire(1L);

        assertThatThrownBy(() -> limiter.acquire(1L))
                .isInstanceOf(AiException.class)
                .hasMessageContaining("hết 3 lượt")
                .hasMessageContaining("61 phút");
    }

    @Test
    @DisplayName("Mỗi user có hạn mức riêng")
    void limitsArePerUser() {
        limiter.acquire(1L);
        limiter.acquire(1L);
        limiter.acquire(1L);

        assertThatCode(() -> limiter.acquire(2L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Giới hạn chung cả app / ngày: nhiều user cộng lại vượt mức → bị chặn, sau 24 giờ dùng lại được")
    void globalDailyLimit() {
        AiProperties props = new AiProperties("k", "http://x", "m", "r", Duration.ofSeconds(5), 3, 4);
        AiRateLimiter global = new AiRateLimiter(props, clock);
        global.acquire(1L);
        global.acquire(1L);
        global.acquire(2L);
        global.acquire(3L); // đủ 4 lượt của cả app

        assertThatThrownBy(() -> global.acquire(4L)) // user mới, còn lượt riêng nhưng app đã hết
                .isInstanceOf(AiException.class)
                .hasMessageContaining("hết lượt dùng chung");

        clock.advance(Duration.ofHours(24));
        assertThatCode(() -> global.acquire(4L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Lần bị chặn vì hết lượt chung không bị tính vào lượt riêng của user")
    void rejectedCallIsNotCounted() {
        AiProperties props = new AiProperties("k", "http://x", "m", "r", Duration.ofSeconds(5), 2, 1);
        AiRateLimiter global = new AiRateLimiter(props, clock);
        global.acquire(1L); // dùng hết 1 lượt chung

        // User 2 thử 3 lần (> 2 lượt/giờ của riêng user 2). Nếu lần bị chặn vẫn bị tính thì lần thứ 3
        // sẽ báo "Bạn đã dùng hết 2 lượt AI trong 1 giờ"; đúng ra cả 3 lần đều do hết lượt CHUNG.
        for (int i = 0; i < 3; i++) {
            assertThatThrownBy(() -> global.acquire(2L))
                    .isInstanceOf(AiException.class)
                    .hasMessageContaining("hết lượt dùng chung");
        }
    }

    @Test
    @DisplayName("Sau 1 giờ (cửa sổ trượt) → dùng lại được")
    void slidingWindowFreesSlots() {
        limiter.acquire(1L);
        clock.advance(Duration.ofMinutes(30));
        limiter.acquire(1L);
        limiter.acquire(1L);
        assertThatThrownBy(() -> limiter.acquire(1L)).isInstanceOf(AiException.class);

        clock.advance(Duration.ofMinutes(30)); // lần gọi đầu tiên đã ra khỏi cửa sổ 1 giờ
        assertThatCode(() -> limiter.acquire(1L)).doesNotThrowAnyException();
    }
}
