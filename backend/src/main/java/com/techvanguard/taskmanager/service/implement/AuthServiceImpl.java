package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.dto.request.LoginRequest;
import com.techvanguard.taskmanager.dto.request.RegisterRequest;
import com.techvanguard.taskmanager.dto.response.AuthResponse;
import com.techvanguard.taskmanager.dto.response.UserProfileResponse;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.exception.BadRequestException;
import com.techvanguard.taskmanager.exception.DuplicateResourceException;
import com.techvanguard.taskmanager.exception.ResourceNotFoundException;
import com.techvanguard.taskmanager.mapper.UserMapper;
import com.techvanguard.taskmanager.repository.UserRepository;
import com.techvanguard.taskmanager.security.JwtTokenProvider;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.AuthService;
import com.techvanguard.taskmanager.service.RateLimiterService;
import com.techvanguard.taskmanager.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lớp triển khai chi tiết cho nghiệp vụ xác thực người dùng.
 * Quản lý quy trình đăng ký, đăng nhập an toàn, thu hồi token bằng Redis và phòng chống brute-force.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final RateLimiterService rateLimiterService;
    private final UserMapper userMapper;

    /**
     * Đăng ký tài khoản người dùng mới vào hệ thống.
     *
     * @param request DTO chứa thông tin đăng ký
     * @return UserProfileResponse Thông tin tài khoản sau khi tạo
     * @throws DuplicateResourceException Khi email đã được sử dụng trước đó
     */
    @Override
    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        log.info("Bắt đầu xử lý đăng ký tài khoản mới cho email: {}", request.getEmail());

        // Bước 1: Kiểm tra xem email này đã tồn tại trong cơ sở dữ liệu hay chưa
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            log.warn("Đăng ký thất bại: Email {} đã tồn tại trên hệ thống", request.getEmail());
            throw new DuplicateResourceException("Địa chỉ email này đã được sử dụng bởi một tài khoản khác");
        }

        // Bước 2: Băm mật khẩu người dùng bằng thuật toán BCrypt trước khi lưu
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Bước 3: Chuyển đổi dữ liệu sang User Entity qua Mapper chuyên biệt
        User newUser = userMapper.toEntity(request, encodedPassword);
        User savedUser = userRepository.save(newUser);
        log.info("Đăng ký tài khoản thành công với User ID: {}", savedUser.getId());

        // Bước 4: Trả về DTO thông tin người dùng an toàn (không chứa password)
        return userMapper.toProfileResponse(savedUser);
    }

    /**
     * Đăng nhập tài khoản, xác thực thông tin và phát hành JWT Access Token.
     *
     * @param request DTO chứa email và mật khẩu
     * @return AuthResponse Chứa token và thông tin user
     * @throws BadRequestException Khi sai mật khẩu hoặc bị chặn bởi Rate Limiter
     */
    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Nhận yêu cầu đăng nhập từ tài khoản: {}", email);

        // Bước 1: Kiểm tra tần suất đăng nhập từ Redis (cho phép tối đa 5 lần thử trong 60 giây để chống brute-force)
        boolean isAllowed = rateLimiterService.isAllowed("login:" + email, 5, 60);
        if (!isAllowed) {
            log.warn("Tài khoản {} bị tạm khóa đăng nhập do thử sai quá 5 lần trong 1 phút", email);
            throw new BadRequestException("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại");
        }

        // Bước 2: Thực hiện xác thực thông tin qua Spring Security AuthenticationManager
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            log.warn("Đăng nhập thất bại cho email {}: Sai mật khẩu", email);
            throw new BadRequestException("Email hoặc mật khẩu không chính xác");
        }

        // Bước 3: Thiết lập Authentication vào SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Bước 4: Sinh mã JWT Access Token với thời hạn 24 giờ
        String accessToken = jwtTokenProvider.generateToken(authentication);

        // Bước 5: Lấy thông tin người dùng từ Principal và bọc vào DTO phản hồi
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User currentUser = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        log.info("Đăng nhập thành công cho người dùng: {} (ID: {})", email, currentUser.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .user(userMapper.toProfileResponse(currentUser))
                .build();
    }

    /**
     * Đăng xuất tài khoản người dùng và đưa token vào danh sách đen của Redis.
     *
     * @param token Chuỗi JWT Token gửi lên từ client
     */
    @Override
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        // Bước 1: Kiểm tra tính hợp lệ của token trước khi thu hồi
        if (jwtTokenProvider.validateToken(token)) {
            // Bước 2: Tính thời gian sống còn lại của token
            long remainingMs = jwtTokenProvider.getRemainingExpirationMs(token);

            // Bước 3: Lưu token vào Redis Blacklist với TTL tương ứng để vô hiệu hóa ngay lập tức
            tokenBlacklistService.blacklistToken(token, remainingMs);
            log.info("Đăng xuất thành công, đã vô hiệu hóa token trong Redis Blacklist");
        }

        // Bước 4: Xóa sạch phiên xác thực hiện tại trong bộ nhớ SecurityContext
        SecurityContextHolder.clearContext();
    }

    /**
     * Lấy thông tin hồ sơ của người dùng hiện tại dựa trên ID định danh.
     *
     * @param currentUserId ID người dùng từ SecurityContext
     * @return UserProfileResponse Thông tin hồ sơ
     */
    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(Long currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        return userMapper.toProfileResponse(user);
    }
}
