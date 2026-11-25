package com.tanseng2027.task_management.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

    @Schema(example = "alice@example.com")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @Schema(example = "Password@123")
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
