package com.tanseng2027.task_management.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

/**
 * Lớp cha cho integration test: khởi động toàn bộ app (H2 + Flyway + dữ liệu seed V3)
 * và gọi API qua MockMvc.
 *
 * - @Transactional: mỗi test tự rollback khi kết thúc → các test không ảnh hưởng dữ liệu của nhau.
 * - Dữ liệu seed: alice@example.com (10 task), bob@example.com (3 task), mật khẩu Password@123.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
abstract class AbstractIntegrationTest {

    protected static final String PASSWORD = "Password@123";
    protected static final String ALICE = "alice@example.com";
    protected static final String BOB = "bob@example.com";

    @Autowired
    protected MockMvc mockMvc;

    /** Đăng nhập và trả về JWT (trường accessToken trong response). */
    protected String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return JsonPath.read(body, "$.accessToken");
    }

    protected String login(String email) throws Exception {
        return login(email, PASSWORD);
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }
}
