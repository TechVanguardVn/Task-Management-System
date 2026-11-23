package com.techvanguard.taskmanager.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Lớp tiện ích chịu trách nhiệm sinh mã (encode) và giải mã (decode) JWT Token.
 * Sử dụng thư viện JJWT phiên bản 0.12.x mới nhất với thuật toán mã hóa HMAC-SHA256.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Tạo khóa bí mật an toàn (SecretKey) từ chuỗi Hex hoặc Base64 trong cấu hình application.yml.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Sinh JWT Access Token từ đối tượng xác thực thành công của người dùng.
     * Lưu trữ ID và Email của người dùng vào Claims để tái sử dụng ở các request tiếp theo.
     *
     * @param authentication Đối tượng xác thực chứa thông tin UserPrincipal
     * @return Chuỗi JWT Token dạng nén
     */
    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(Long.toString(userPrincipal.getId()))
                .claim("email", userPrincipal.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Trích xuất ID người dùng từ Claims trong JWT Token.
     *
     * @param token Chuỗi JWT Token nhận từ Client
     * @return ID định danh của người dùng
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.parseLong(claims.getSubject());
    }

    /**
     * Lấy thời gian hết hạn còn lại của token (tính bằng milli-giây) phục vụ lưu Blacklist vào Redis.
     *
     * @param token Chuỗi JWT Token
     * @return Số milli-giây còn lại trước khi token tự hết hạn
     */
    public long getRemainingExpirationMs(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Date expiration = claims.getExpiration();
        long diff = expiration.getTime() - System.currentTimeMillis();
        return Math.max(diff, 0);
    }

    /**
     * Kiểm tra tính hợp lệ và chữ ký của JWT Token.
     * Bắt từng loại ngoại lệ cụ thể để ghi log rõ ràng phục vụ việc giám sát bảo mật.
     *
     * @param token Chuỗi JWT Token cần kiểm định
     * @return true nếu token hợp lệ và còn hạn; false nếu có bất kỳ lỗi nào
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.warn("Chữ ký JWT không hợp lệ hoặc cấu trúc token bị sai định dạng: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.warn("Phiên đăng nhập JWT đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Token JWT không được hỗ trợ bởi hệ thống: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("Chuỗi JWT rỗng hoặc không có dữ liệu claims: {}", ex.getMessage());
        }
        return false;
    }
}
