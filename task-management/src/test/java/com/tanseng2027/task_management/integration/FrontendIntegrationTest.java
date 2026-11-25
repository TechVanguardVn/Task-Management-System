package com.tanseng2027.task_management.integration;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Frontend là file tĩnh trong resources/static: phải tải được khi CHƯA đăng nhập,
 * còn dữ liệu thì vẫn được bảo vệ bởi các API /api/** (đã test ở các class khác).
 */
class FrontendIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("Trang chủ / chuyển tới index.html mà không cần token")
    void rootServesIndex() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("index.html"));
    }

    @Test
    @DisplayName("index.html, CSS, JS, favicon tải được mà không cần token")
    void staticAssetsArePublic() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Task Manager")));
        mockMvc.perform(get("/css/app.css")).andExpect(status().isOk());
        mockMvc.perform(get("/js/app.js")).andExpect(status().isOk());
        mockMvc.perform(get("/js/api.js")).andExpect(status().isOk());
        mockMvc.perform(get("/favicon.svg")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Trang web có CSP chỉ cho chạy script của chính web, và chống bị nhúng vào trang khác")
    void securityHeadersOnApp() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(header().string("Content-Security-Policy", containsString("script-src 'self';")))
                .andExpect(header().string("Content-Security-Policy", containsString("connect-src 'self'")))
                .andExpect(header().string("Content-Security-Policy", containsString("frame-ancestors 'self'")))
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));
        // API cũng có header (kể cả khi trả lỗi 401)
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Security-Policy", containsString("object-src 'none'")));
    }

    @Test
    @DisplayName("Swagger UI được nới CSS inline nhưng script vẫn chỉ từ chính web")
    void swaggerCspAllowsInlineStyleOnly() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Security-Policy", containsString("style-src 'self' 'unsafe-inline'")))
                .andExpect(header().string("Content-Security-Policy", containsString("script-src 'self';")));
    }
}
