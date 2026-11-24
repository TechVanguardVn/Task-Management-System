package backend.config;

import java.util.List;

import backend.dto.ApiErrorResponse;
import backend.security.JwtAuthenticationFilter;
import backend.security.JwtService;
import backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper,
                                            CorsConfigurationSource corsConfigurationSource,
                                            JwtService jwt, AuthService auth) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource))
                // Credentials are explicit bearer headers; cookies/basic/form auth are not accepted.
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .addFilterBefore(new JwtAuthenticationFilter(jwt, auth, objectMapper), UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/projects").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/projects", "/api/projects/*").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/projects/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/projects/*").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/projects/*/archive").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/projects/*/tasks").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/tasks", "/api/tasks/*").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/tasks/*").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/tasks/*/status").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/tasks/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/dashboard/summary", "/api/dashboard/upcoming", "/api/dashboard/overdue").authenticated()
                        // Business routes are introduced only with their own authorization rules.
                        .anyRequest().denyAll())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setHeader("WWW-Authenticate", "Bearer");
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getOutputStream(), ApiErrorResponse.of(
                                    HttpStatus.UNAUTHORIZED, "Authentication is required", request.getRequestURI()));
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getOutputStream(), ApiErrorResponse.of(
                                    HttpStatus.FORBIDDEN, "Access is denied", request.getRequestURI()));
                        }));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.frontend-url}") String frontendUrl) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-CSRF-TOKEN"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
