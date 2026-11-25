package com.tanseng2027.task_management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.tanseng2027.task_management.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Chỉ register/login là public; /api/auth/logout cần token hợp lệ
                .requestMatchers("/api/auth/register", "/api/auth/login", "/h2-console/**").permitAll()
                // Frontend (file tĩnh trong resources/static) - dữ liệu vẫn được bảo vệ bởi các API ở dưới
                .requestMatchers("/", "/index.html", "/favicon.svg", "/css/**", "/js/**", "/error").permitAll()
                // Swagger UI và tài liệu OpenAPI
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Kiểm tra JWT trước khi Spring Security xử lý xác thực
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // Chưa đăng nhập / token sai → 401 (mặc định Spring trả 403)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            );

        http.headers(headers -> headers
            // Chống clickjacking: chỉ cho phép nhúng trang vào iframe của CHÍNH web này
            // (H2 console dùng iframe cùng origin nên vẫn chạy được)
            .frameOptions(frame -> frame.sameOrigin())
            .addHeaderWriter(SecurityConfig::writeContentSecurityPolicy)
        );

        return http.build();
    }
    
    static final String APP_CSP = "default-src 'self'; script-src 'self'; style-src 'self'; "
            + "img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; "
            + "base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

    /** Swagger UI tự gắn CSS inline nên cần 'unsafe-inline' cho style; script vẫn chỉ từ chính web. */
    static final String SWAGGER_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            + "img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'";

    private static void writeContentSecurityPolicy(HttpServletRequest request, HttpServletResponse response) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (path.startsWith("/h2-console")) {
            return; // H2 console (chỉ bật khi chạy local) dùng nhiều script inline, không áp CSP
        }
        boolean swagger = path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs");
        response.setHeader("Content-Security-Policy", swagger ? SWAGGER_CSP : APP_CSP);
    }
}