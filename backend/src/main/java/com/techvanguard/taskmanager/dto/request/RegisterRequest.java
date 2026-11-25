package com.techvanguard.taskmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận dữ liệu khi người dùng đăng ký tài khoản mới.
 * Kiểm định chặt chẽ dữ liệu đầu vào bằng Bean Validation trước khi chuyển vào Service xử lý.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    /**
     * Email đăng ký, bắt buộc phải đúng định dạng email tiêu chuẩn và không được để trống.
     */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Địa chỉ email không đúng định dạng hợp lệ")
    @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
    private String email;

    /**
     * Mật khẩu tài khoản, yêu cầu độ dài từ 6 đến 50 ký tự để đảm bảo độ phức tạp.
     */
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 50, message = "Mật khẩu phải có độ dài từ 6 đến 50 ký tự")
    private String password;

    /**
     * Họ tên người dùng, giới hạn độ dài hợp lý để tránh rác cơ sở dữ liệu.
     */
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
    private String fullName;
}
