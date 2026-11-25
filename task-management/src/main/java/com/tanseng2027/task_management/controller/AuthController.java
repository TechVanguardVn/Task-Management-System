package com.tanseng2027.task_management.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tanseng2027.task_management.dto.request.LoginRequest;
import com.tanseng2027.task_management.dto.request.RegisterRequest;
import com.tanseng2027.task_management.dto.response.AuthResponse;
import com.tanseng2027.task_management.exception.ErrorResponse;
import com.tanseng2027.task_management.service.AuthenticationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "1. Auth", description = "Đăng ký, đăng nhập, đăng xuất")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authService;

    @Operation(summary = "Đăng ký tài khoản")
    @SecurityRequirements // API public, không cần token
    @ApiResponse(responseCode = "200", description = "Đăng ký thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ (email sai định dạng, mật khẩu < 6 ký tự...)")
    @ApiResponse(responseCode = "409", description = "Email đã được đăng ký")
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @Operation(summary = "Đăng nhập",
            description = "Trả về `accessToken` (JWT). Dán token này vào nút **Authorize** "
                    + "hoặc gửi kèm header `Authorization: Bearer <accessToken>`.")
    @SecurityRequirements // API public, không cần token
    @ApiResponse(responseCode = "200", description = "Đăng nhập thành công")
    @ApiResponse(responseCode = "400", description = "Thiếu email hoặc mật khẩu",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Sai email hoặc mật khẩu", content = @Content)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Đăng xuất",
            description = "Thu hồi token đang dùng. Sau khi đăng xuất, mọi request dùng token này đều bị 401.")
    @ApiResponse(responseCode = "204", description = "Đăng xuất thành công")
    @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / token không hợp lệ / token đã bị thu hồi", content = @Content)
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            // Swagger UI tự gửi header này từ nút Authorize nên ẩn đi
            @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        authService.logout(authHeader.substring("Bearer ".length()));
        return ResponseEntity.noContent().build();
    }
}
