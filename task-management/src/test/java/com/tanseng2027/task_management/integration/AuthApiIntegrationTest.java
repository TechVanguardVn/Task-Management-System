package com.tanseng2027.task_management.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.tanseng2027.task_management.repository.UserRepository;

class AuthApiIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Đăng ký → mật khẩu được lưu dạng BCrypt → đăng nhập được bằng tài khoản mới")
    void register_thenLogin() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName": "Carol", "email": "carol@example.com", "password": "secret123"}
                                """))
                .andExpect(status().isOk());

        String storedPassword = userRepository.findByEmail("carol@example.com").orElseThrow().getPassword();
        assertThat(storedPassword).isNotEqualTo("secret123").startsWith("$2a$");

        String token = login("carol@example.com", "secret123");
        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0)); // user mới chưa có task
    }

    @Test
    @DisplayName("Đăng ký dữ liệu không hợp lệ → 400 kèm lỗi từng field")
    void register_invalid_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName": "", "email": "not-an-email", "password": "123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    @DisplayName("Đăng ký email đã tồn tại → 409 kèm thông báo")
    void register_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName": "Alice 2", "email": "alice@example.com", "password": "secret123"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Đăng nhập thành công → trả về accessToken + thông tin user")
    void login_returnsTokenAndUserInfo() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@example.com", "password": "Password@123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600)) // application-test.yml: 3600000 ms
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.fullName").value("Alice Nguyen"));
    }

    @Test
    @DisplayName("Đăng nhập thiếu email / mật khẩu → 400 kèm lỗi từng field")
    void login_blankFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "", "password": ""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    @DisplayName("Đăng nhập sai mật khẩu → 401")
    void login_wrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "alice@example.com", "password": "wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Không có token / token rác → 401")
    void protectedApi_withoutValidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Đăng xuất → 204, sau đó token cũ bị từ chối (401), token của phiên khác vẫn dùng được")
    void logout_revokesOnlyThatToken() throws Exception {
        String token1 = login(ALICE);
        Thread.sleep(1100); // JWT tính thời gian theo giây → đợi để 2 token khác nhau
        String token2 = login(ALICE);
        assertThat(token1).isNotEqualTo(token2);

        mockMvc.perform(post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(token1)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, bearer(token1)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(token1)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, bearer(token2)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Đăng xuất khi chưa đăng nhập → 401")
    void logout_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Swagger / OpenAPI truy cập được mà không cần token")
    void openApiDocs_isPublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Task Management System API"));
    }
}
