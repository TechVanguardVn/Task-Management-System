package com.techvanguard.taskmanager.controller;

import com.techvanguard.taskmanager.dto.request.LoginRequest;
import com.techvanguard.taskmanager.dto.request.RegisterRequest;
import com.techvanguard.taskmanager.dto.response.ApiResponse;
import com.techvanguard.taskmanager.dto.response.AuthResponse;
import com.techvanguard.taskmanager.dto.response.UserProfileResponse;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý toàn bộ các yêu cầu liên quan đến xác thực người dùng.
 * Bao gồm: Đăng ký tài khoản, Đăng nhập cấp JWT, Đăng xuất thu hồi token và Lấy thông tin tài khoản hiện tại.
 * Tuân thủ quy chuẩn 100% endpoint trả về cấu trúc ApiResponse<T>.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Các API xác thực, phân quyền và quản lý phiên đăng nhập")
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint đăng ký tài khoản người dùng mới.
     *
     * @param request DTO chứa thông tin đăng ký hợp lệ
     * @return ApiResponse chứa hồ sơ tài khoản vừa khởi tạo thành công
     */
    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Tạo mới tài khoản người dùng với email và mật khẩu được băm BCrypt")
    public ResponseEntity<ApiResponse<UserProfileResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Gọi endpoint POST /api/v1/auth/register cho email: {}", request.getEmail());
        UserProfileResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký tài khoản thành công"));
    }

    /**
     * Endpoint đăng nhập người dùng và phát hành JWT Access Token.
     *
     * @param request DTO chứa email và mật khẩu
     * @return ApiResponse chứa JWT Token và thông tin user
     */
    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Xác thực email/mật khẩu và nhận JWT Access Token có thời hạn 24 giờ")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Gọi endpoint POST /api/v1/auth/login cho email: {}", request.getEmail());
        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    /**
     * Endpoint đăng xuất tài khoản và đưa token hiện tại vào Redis Blacklist.
     *
     * @param authHeader Chuỗi Header Authorization: Bearer <token>
     * @return ApiResponse thông báo đăng xuất thành công
     */
    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất tài khoản", description = "Hủy bỏ token hiện tại và lưu vào Redis Blacklist để ngăn chặn tái sử dụng")
    @SecurityRequirement(name = "BearerAuth")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = null;
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        authService.logout(token);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công"));
    }

    /**
     * Endpoint lấy thông tin hồ sơ của người dùng đang đăng nhập dựa trên JWT token.
     *
     * @param currentUser Thông tin UserPrincipal được Spring Security tự động giải mã từ token
     * @return ApiResponse chứa hồ sơ người dùng
     */
    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Lấy hồ sơ cá nhân của người dùng đang sở hữu token hợp lệ")
    @SecurityRequirement(name = "BearerAuth")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileResponse response = authService.getCurrentUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin tài khoản thành công"));
    }
}
