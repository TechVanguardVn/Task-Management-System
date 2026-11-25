package com.tanseng2027.task_management.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;


@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Task Management System API",
                version = "1.0.0",
                description = """
                        REST API quản lý công việc cá nhân: tài khoản (JWT), CRUD task, tìm kiếm/lọc/phân trang, dashboard.

                        **Cách thử API trên Swagger UI:**
                        1. Gọi `POST /api/auth/login` với tài khoản demo `alice@example.com` / `Password@123`
                        2. Copy giá trị `accessToken` trong response
                        3. Bấm nút **Authorize** (góc trên bên phải), dán token (không cần gõ chữ `Bearer`) rồi bấm Authorize
                        4. Gọi các API còn lại
                        """),
        security = @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH))
@SecurityScheme(
        name = OpenApiConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Dán JWT lấy từ POST /api/auth/login")
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";
}
