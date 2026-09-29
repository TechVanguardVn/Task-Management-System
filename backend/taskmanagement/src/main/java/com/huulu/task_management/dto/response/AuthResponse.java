package com.huulu.task_management.dto.response;

public record AuthResponse(String token, UserResponse user) {
}
