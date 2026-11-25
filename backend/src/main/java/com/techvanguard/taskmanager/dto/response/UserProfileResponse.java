package com.techvanguard.taskmanager.dto.response;

import com.techvanguard.taskmanager.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO phản hồi chứa thông tin hồ sơ công khai của người dùng.
 * Tuyệt đối không chứa trường password hay các thông tin nhạy cảm của hệ thống.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String email;
    private String fullName;
    private UserRole role;
    private LocalDateTime createdAt;
}
