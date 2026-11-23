package com.techvanguard.taskmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận dữ liệu thông tin đăng nhập của người dùng.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /**
     * Email dùng để đăng nhập.
     */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Địa chỉ email không đúng định dạng hợp lệ")
    private String email;

    /**
     * Mật khẩu đăng nhập dạng thô gửi từ client (sẽ được đối chiếu bằng BCrypt).
     */
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
