package com.techvanguard.taskmanager.enums;

/**
 * Định nghĩa vai trò của người dùng trong hệ thống.
 */
public enum UserRole {
    ROLE_USER("Người dùng tiêu chuẩn"),
    ROLE_ADMIN("Quản trị viên hệ thống");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
