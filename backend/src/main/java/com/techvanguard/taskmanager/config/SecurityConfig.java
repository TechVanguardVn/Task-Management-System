package com.techvanguard.taskmanager.config;

import com.techvanguard.taskmanager.security.JwtAuthenticationEntryPoint;
import com.techvanguard.taskmanager.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cấu hình bảo mật hệ thống toàn diện với Spring Security 6 và JWT.
 * Thiết lập cơ chế Stateless, tích hợp JwtAuthenticationFilter, JwtAuthenticationEntryPoint,
 * mở quyền cho các endpoint công khai (Đăng ký, Đăng nhập, Swagger) và bảo vệ các API còn lại.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Mã hóa mật khẩu một chiều bằng thuật toán BCrypt với độ phức tạp (strength) = 12.
     * Mức 12 đảm bảo an toàn cao trước các đợt tấn công brute-force offline.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Khởi tạo AuthenticationManager chuẩn từ AuthenticationConfiguration của Spring Security.
     * Được sử dụng trong AuthService để xác thực thông tin đăng nhập email và password.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Cấu hình chuỗi lọc bảo mật SecurityFilterChain chuẩn kiến trúc Stateless JWT.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // SECURITY: Tắt CSRF vì toàn bộ hệ thống sử dụng cơ chế JWT Stateless không dùng cookie session
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Cho phép hiển thị giao diện H2 Console qua iframe (chỉ dùng cho môi trường dev)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                // Bắt lỗi 401 Unauthorized và trả về JSON ApiResponse chuẩn mực
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                // Không lưu trữ trạng thái phiên làm việc (Session) trên bộ nhớ RAM của Server
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Cho phép truy cập tự do vào tài liệu Swagger UI và H2 console
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/h2-console/**"
                        ).permitAll()
                        // Cho phép truy cập công khai vào các endpoint Đăng ký và Đăng nhập
                        .requestMatchers(
                                "/api/v1/auth/register",
                                "/api/v1/auth/login"
                        ).permitAll()
                        // Mọi yêu cầu nghiệp vụ còn lại đều bắt buộc phải có JWT Token hợp lệ
                        .anyRequest().authenticated()
                );

        // Đặt bộ lọc JwtAuthenticationFilter chạy trước UsernamePasswordAuthenticationFilter mặc định của Spring
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Cấu hình nguồn CORS cho phép Frontend React/Vite kết nối API an toàn.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
