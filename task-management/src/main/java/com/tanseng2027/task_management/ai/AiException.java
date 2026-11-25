package com.tanseng2027.task_management.ai;

import lombok.Getter;


@Getter
public class AiException extends RuntimeException {

    public enum Reason {
        /** Chưa cấu hình AI_API_KEY → 503 */
        NOT_CONFIGURED,
        /** Hết lượt (giới hạn của app hoặc hạn mức của Gemini) → 429 */
        RATE_LIMITED,
        /** Gemini lỗi, sai key, quá thời gian chờ... → 503 */
        UNAVAILABLE,
        /** AI trả về nội dung rỗng / sai định dạng → 502 */
        INVALID_OUTPUT
    }

    private final Reason reason;

    public AiException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public AiException(Reason reason, String message, Throwable cause) {
        super(message, cause);
        this.reason = reason;
    }
}
