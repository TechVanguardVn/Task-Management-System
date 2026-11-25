package com.techvanguard.taskmanager.mapper;

import com.techvanguard.taskmanager.dto.request.RegisterRequest;
import com.techvanguard.taskmanager.dto.response.UserProfileResponse;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.UserRole;
import org.springframework.stereotype.Component;

/**
 * Lớp chuyển đổi (Mapper) chuyên biệt giữa thực thể User và các đối tượng DTO.
 * Tách biệt hoàn toàn logic mapping ra khỏi Controller và Service để tuân thủ nguyên tắc Single Responsibility.
 */
@Component
public class UserMapper {

    /**
     * Chuyển đổi từ dữ liệu form đăng ký (RegisterRequest) sang thực thể User.
     * Mật khẩu truyền vào phải là mật khẩu đã được mã hóa bằng BCrypt.
     *
     * @param request DTO chứa thông tin đăng ký
     * @param encodedPassword Mật khẩu đã được băm an toàn
     * @return Đối tượng User Entity sẵn sàng lưu vào Database
     */
    public User toEntity(RegisterRequest request, String encodedPassword) {
        return User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .password(encodedPassword)
                .fullName(request.getFullName().trim())
                .role(UserRole.ROLE_USER)
                .build();
    }

    /**
     * Chuyển đổi từ thực thể User sang DTO UserProfileResponse để trả về cho Client an toàn.
     *
     * @param user Thực thể User từ cơ sở dữ liệu
     * @return UserProfileResponse không chứa trường mật khẩu
     */
    public UserProfileResponse toProfileResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
