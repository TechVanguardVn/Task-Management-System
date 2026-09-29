package com.huulu.task_management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.huulu.task_management.dto.request.LoginRequest;
import com.huulu.task_management.dto.request.RegisterRequest;
import com.huulu.task_management.entity.User;
import com.huulu.task_management.exception.InvalidCredentialsException;
import com.huulu.task_management.repository.UserRepository;
import com.huulu.task_management.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginReturnsGenericInvalidCredentialsError() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("alice@example.com", "wrongpass")));
    }

    @Test
    void registerNormalizesEmailAndReturnsToken() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(5L);
            return user;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt");

        var response = authService.register(
                new RegisterRequest(" Alice ", " ALICE@EXAMPLE.COM ", "Password@123"));

        assertEquals("jwt", response.token());
        assertEquals("alice@example.com", response.user().email());
        assertEquals("Alice", response.user().fullName());
        assertEquals(5L, response.user().id());
    }
}
