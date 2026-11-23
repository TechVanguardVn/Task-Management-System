package com.techvanguard.taskmanager.security;

import com.techvanguard.taskmanager.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Bộ lọc xác thực JWT thực thi duy nhất 1 lần trên mỗi HTTP Request (OncePerRequestFilter).
 * Trích xuất Bearer token từ header, kiểm tra danh sách đen Redis và nạp phiên đăng nhập vào SecurityContext.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            // Bước 1: Trích xuất chuỗi JWT token từ Header Authorization
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                // Bước 2: Kiểm tra xem token này đã bị người dùng đăng xuất trước đó hay chưa qua Redis Blacklist
                if (tokenBlacklistService.isBlacklisted(jwt)) {
                    log.warn("Từ chối truy cập: Token đã bị thu hồi (nằm trong Redis Blacklist)");
                    filterChain.doFilter(request, response);
                    return;
                }

                // Bước 3: Xác thực chữ ký và thời hạn của token
                if (tokenProvider.validateToken(jwt)) {
                    Long userId = tokenProvider.getUserIdFromToken(jwt);

                    // Bước 4: Nạp thông tin chi tiết người dùng và khởi tạo quyền trong Spring Security Context
                    UserDetails userDetails = userDetailsService.loadUserById(userId);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            log.error("Không thể thiết lập thông tin xác thực người dùng vào SecurityContext", ex);
        }

        // Bước 5: Tiếp tục chuyển tiếp request sang các filter tiếp theo trong chuỗi FilterChain
        filterChain.doFilter(request, response);
    }

    /**
     * Bóc tách token từ Header: Authorization: Bearer <token>.
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
