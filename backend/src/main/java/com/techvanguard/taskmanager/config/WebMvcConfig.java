package com.techvanguard.taskmanager.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình Web MVC và chính sách chia sẻ tài nguyên nguồn gốc chéo (CORS).
 * Cho phép ứng dụng Frontend (React Vite trên cổng 3000 hoặc 5173) gọi API an toàn.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // SECURITY: Chỉ định rõ các domain Client được phép gọi API, không dùng wildcard * bừa bãi
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
