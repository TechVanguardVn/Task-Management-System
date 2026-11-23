package com.techvanguard.taskmanager.security;

import com.techvanguard.taskmanager.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Lớp chuyển đổi thực thể User sang đối tượng UserDetails mà Spring Security hiểu được.
 * Đóng gói ID, email, mật khẩu và quyền hạn của người dùng đang đăng nhập vào phiên làm việc.
 */
@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * Phương thức tạo nhanh UserPrincipal từ đối tượng User Entity lấy từ database.
     *
     * @param user Thực thể người dùng từ cơ sở dữ liệu
     * @return UserPrincipal chuẩn cho Spring Security
     */
    public static UserPrincipal create(User user) {
        // Gắn tiền tố vai trò để Spring Security nhận diện quyền hạn trong @PreAuthorize
        GrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getFullName(),
                Collections.singletonList(authority)
        );
    }

    @Override
    public String getUsername() {
        // Sử dụng email làm tên định danh đăng nhập chính thức
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
