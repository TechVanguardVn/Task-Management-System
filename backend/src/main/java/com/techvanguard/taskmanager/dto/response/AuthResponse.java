package com.techvanguard.taskmanager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO phản hồi trả về sau khi người dùng đăng nhập thành công.
 * Chứa chuỗi Access Token JWT cùng thông tin hồ sơ cơ bản của người dùng.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /**
     * Chuỗi Access Token JWT dùng để gắn vào Header: Authorization: Bearer <token>.
     */
    private String accessToken;

    /**
     * Loại token định danh theo chuẩn OAuth2 / OpenID Connect (mặc định là Bearer).
     */
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * Thông tin hồ sơ cơ bản của người dùng vừa đăng nhập.
     */
    private UserProfileResponse user;
}
