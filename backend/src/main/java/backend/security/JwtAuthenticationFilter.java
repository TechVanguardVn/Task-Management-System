package backend.security;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import backend.dto.ApiErrorResponse;
import backend.exception.AuthException;
import backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.TransactionException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final AuthService auth;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtService jwt, AuthService auth, ObjectMapper objectMapper) {
        this.jwt = jwt;
        this.auth = auth;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return ("GET".equals(request.getMethod()) && "/api/health".equals(request.getServletPath()))
                || ("POST".equals(request.getMethod()) && List.of("/api/auth/register", "/api/auth/login")
                .contains(request.getServletPath()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var headers = Collections.list(request.getHeaders("Authorization"));
        if (headers.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }
        try {
            String header = headers.getFirst();
            if (headers.size() != 1 || header.length() > 8192 || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
                throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid or expired credentials");
            }
            String token = header.substring(7);
            AuthPrincipal principal = jwt.verify(token);
            auth.validateSession(principal, token);
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of()));
            SecurityContextHolder.setContext(context);
        } catch (JwtException | AuthException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            response.setStatus(401);
            response.setHeader("WWW-Authenticate", "Bearer");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), ApiErrorResponse.of(
                    HttpStatus.UNAUTHORIZED, "Invalid or expired credentials", request.getRequestURI()));
            return;
        } catch (DataAccessException | TransactionException exception) {
            SecurityContextHolder.clearContext();
            response.setStatus(503);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), ApiErrorResponse.of(
                    HttpStatus.SERVICE_UNAVAILABLE, "Authentication service is unavailable", request.getRequestURI()));
            return;
        }
        chain.doFilter(request, response);
    }
}
