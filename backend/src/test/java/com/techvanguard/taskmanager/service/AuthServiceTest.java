package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.request.LoginRequest;
import com.techvanguard.taskmanager.dto.request.RegisterRequest;
import com.techvanguard.taskmanager.dto.response.AuthResponse;
import com.techvanguard.taskmanager.dto.response.UserProfileResponse;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.UserRole;
import com.techvanguard.taskmanager.exception.BadRequestException;
import com.techvanguard.taskmanager.exception.DuplicateResourceException;
import com.techvanguard.taskmanager.mapper.UserMapper;
import com.techvanguard.taskmanager.repository.UserRepository;
import com.techvanguard.taskmanager.security.JwtTokenProvider;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.implement.AuthServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Bộ kiểm thử đơn vị (Unit Test) cho AuthService.
 * Sử dụng Mockito để cô lập các phụ thuộc bên ngoài (Database, Redis, Spring Security).
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private RateLimiterService rateLimiterService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("Đăng ký thành công khi email chưa tồn tại")
    void register_Success() {
        // Giả lập dữ liệu đầu vào
        RegisterRequest request = RegisterRequest.builder()
                .email("vanlh25@gmail.com")
                .password("Password123")
                .fullName("Lê Hữu Văn")
                .build();

        User savedUser = User.builder()
                .email("vanlh25@gmail.com")
                .password("hashed_password")
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .build();
        savedUser.setId(1L);

        UserProfileResponse expectedResponse = UserProfileResponse.builder()
                .id(1L)
                .email("vanlh25@gmail.com")
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .createdAt(LocalDateTime.now())
                .build();

        // Thiết lập hành vi cho các mock objects
        when(userRepository.existsByEmail("vanlh25@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("hashed_password");
        when(userMapper.toEntity(request, "hashed_password")).thenReturn(savedUser);
        when(userRepository.save(savedUser)).thenReturn(savedUser);
        when(userMapper.toProfileResponse(savedUser)).thenReturn(expectedResponse);

        // Thực thi hàm cần test
        UserProfileResponse actualResponse = authService.register(request);

        // Kiểm tra kết quả
        assertThat(actualResponse).isNotNull();
        assertThat(actualResponse.getEmail()).isEqualTo("vanlh25@gmail.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại và ném DuplicateResourceException khi email đã có người dùng")
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("existed@gmail.com")
                .password("Password123")
                .fullName("Người Dùng")
                .build();

        when(userRepository.existsByEmail("existed@gmail.com")).thenReturn(true);

        // Kỳ vọng ném ngoại lệ DuplicateResourceException
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("đã được sử dụng");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập thành công và trả về JWT Access Token hợp lệ")
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("vanlh25@gmail.com")
                .password("Password123")
                .build();

        User user = User.builder()
                .email("vanlh25@gmail.com")
                .password("hashed_password")
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .build();
        user.setId(1L);

        UserPrincipal principal = new UserPrincipal(1L, "vanlh25@gmail.com", "hashed_password", "Lê Hữu Văn", Collections.emptyList());
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        UserProfileResponse profileResponse = UserProfileResponse.builder()
                .id(1L)
                .email("vanlh25@gmail.com")
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .build();

        when(rateLimiterService.isAllowed(anyString(), any(Integer.class), any(Long.class))).thenReturn(true);
        when(authenticationManager.authenticate(any(Authentication.class))).thenReturn(auth);
        when(jwtTokenProvider.generateToken(auth)).thenReturn("mocked.jwt.token");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userMapper.toProfileResponse(user)).thenReturn(profileResponse);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getUser().getEmail()).isEqualTo("vanlh25@gmail.com");
    }

    @Test
    @DisplayName("Đăng nhập thất bại và ném BadRequestException khi nhập sai mật khẩu")
    void login_BadCredentials_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("vanlh25@gmail.com")
                .password("WrongPassword")
                .build();

        when(rateLimiterService.isAllowed(anyString(), any(Integer.class), any(Long.class))).thenReturn(true);
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không chính xác");
    }

    @Test
    @DisplayName("Đăng xuất thành công gọi Blacklist Token vào Redis")
    void logout_Success() {
        String token = "valid.jwt.token";

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getRemainingExpirationMs(token)).thenReturn(60000L);

        authService.logout(token);

        verify(tokenBlacklistService).blacklistToken(token, 60000L);
    }
}
