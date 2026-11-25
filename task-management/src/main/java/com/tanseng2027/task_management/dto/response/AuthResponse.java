package com.tanseng2027.task_management.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    @Schema(description = "JWT, gửi kèm header Authorization: Bearer <accessToken>",
            example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGljZUBleGFtcGxlLmNvbSJ9.xxx")
    private String accessToken;

    @Schema(example = "Bearer")
    private String tokenType;

    @Schema(description = "Thời gian sống của token (giây)", example = "86400")
    private long expiresIn;

    @Schema(example = "alice@example.com")
    private String email;

    @Schema(example = "Alice Nguyen")
    private String fullName;
}
