package com.techvanguard.taskmanager.entity;

import com.techvanguard.taskmanager.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể User đại diện cho tài khoản người dùng trong hệ thống.
 * Kế thừa BaseEntity để tự động có trường id khóa chính cùng createdAt, updatedAt.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    /**
     * Email dùng để đăng nhập và nhận thông báo, phải là duy nhất trên toàn hệ thống.
     * Đánh chỉ mục (Index) vì trường này xuất hiện thường xuyên trong mệnh đề WHERE khi đăng nhập.
     */
    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Mật khẩu đã được băm bằng thuật toán BCrypt.
     * Tuyệt đối không bao giờ lưu trữ mật khẩu dạng plain text vào cơ sở dữ liệu.
     */
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    /**
     * Họ và tên hiển thị của người dùng trên giao diện ứng dụng.
     */
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    /**
     * Vai trò phân quyền trong hệ thống (ROLE_USER, ROLE_ADMIN).
     * Lưu dưới dạng chuỗi String trong DB để dễ đọc dữ liệu trực tiếp khi truy vấn.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.ROLE_USER;
}
