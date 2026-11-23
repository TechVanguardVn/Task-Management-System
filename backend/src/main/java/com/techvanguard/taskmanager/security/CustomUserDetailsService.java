package com.techvanguard.taskmanager.security;

import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service nạp thông tin người dùng từ cơ sở dữ liệu phục vụ xác thực Spring Security.
 * Triển khai interface UserDetailsService chuẩn mực.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Tìm kiếm và nạp thông tin người dùng thông qua email đăng nhập.
     *
     * @param email Địa chỉ email gửi lên từ form đăng nhập
     * @return UserDetails Đối tượng chứa thông tin xác thực
     * @throws UsernameNotFoundException Khi không tìm thấy tài khoản với email tương ứng
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với email: " + email));

        return UserPrincipal.create(user);
    }

    /**
     * Nạp thông tin người dùng dựa vào ID định danh sau khi giải mã JWT token thành công.
     *
     * @param id ID người dùng được lưu trong claims của JWT
     * @return UserDetails Đối tượng chứa thông tin xác thực
     * @throws UsernameNotFoundException Khi không tìm thấy tài khoản
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với ID: " + id));

        return UserPrincipal.create(user);
    }
}
