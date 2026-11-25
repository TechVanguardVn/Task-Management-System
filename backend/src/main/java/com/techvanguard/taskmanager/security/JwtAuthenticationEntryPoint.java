package com.techvanguard.taskmanager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techvanguard.taskmanager.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Điểm xử lý lỗi xác thực (AuthenticationEntryPoint) khi người dùng cố tình truy cập vào
 * các API được bảo vệ mà không cung cấp token hợp lệ hoặc token đã hết hạn.
 * Trả về JSON ApiResponse chuẩn mã HTTP 401 UNAUTHORIZED thay vì trang lỗi HTML trắng của server.
 */
@Component
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        log.warn("Truy cập chưa được cấp quyền tại URL: [{}] - Lý do: {}",
                request.getRequestURI(), authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());

        ApiResponse<Void> apiResponse = ApiResponse.error(
                HttpStatus.UNAUTHORIZED.value(),
                "Bạn cần đăng nhập để truy cập tài nguyên này"
        );

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
