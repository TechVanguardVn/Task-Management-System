package com.tanseng2027.task_management.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tanseng2027.task_management.dto.request.LoginRequest;
import com.tanseng2027.task_management.dto.request.RegisterRequest;
import com.tanseng2027.task_management.dto.response.AuthResponse;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.exception.DuplicateResourceException;
import com.tanseng2027.task_management.repository.UserRepository;
import com.tanseng2027.task_management.security.JwtService;
import com.tanseng2027.task_management.security.TokenBlacklistService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TokenBlacklistService tokenBlacklistService;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email đã được đăng ký");
        }
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);
        return "Đăng ký thành công";
    }

    public AuthResponse login(LoginRequest request) {
        // Sai email / mật khẩu → AuthenticationManager ném BadCredentialsException → Spring Security trả 401
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = (User) authentication.getPrincipal();

        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMs() / 1000)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }

    // Thu hồi token hiện tại; các request sau dùng token này sẽ bị 401
    public void logout(String token) {
        tokenBlacklistService.revoke(token);
    }
}