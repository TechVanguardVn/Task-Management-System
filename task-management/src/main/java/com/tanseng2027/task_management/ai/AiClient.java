package com.tanseng2027.task_management.ai;

import java.util.Map;

public interface AiClient {

    /** false khi chưa cấu hình API key → frontend ẩn các nút AI. */
    boolean isEnabled();

    String modelName();

    /**
     * Gửi yêu cầu và nhận về 1 chuỗi JSON tuân theo {@code jsonSchema}.
     *
     * @param systemInstruction hướng dẫn cho model (luật, ngày hôm nay...)
     * @param input             nội dung người dùng nhập
     * @param jsonSchema        JSON Schema của kết quả mong muốn
     * @return chuỗi JSON do model sinh ra (chưa được kiểm tra nội dung - bên gọi phải tự validate)
     * @throws AiException khi chưa cấu hình, hết lượt, lỗi kết nối hoặc kết quả rỗng
     */
    String generateJson(String systemInstruction, String input, Map<String, Object> jsonSchema);
}
