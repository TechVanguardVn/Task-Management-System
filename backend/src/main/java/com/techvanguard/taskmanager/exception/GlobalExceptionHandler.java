package com.techvanguard.taskmanager.exception;

import com.techvanguard.taskmanager.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

/**
 * Bộ xử lý ngoại lệ tập trung toàn ứng dụng (Global Exception Handler).
 * Đảm bảo 100% lỗi trả về đều được bọc trong định dạng ApiResponse thống nhất,
 * không làm rò rỉ chi tiết nhạy cảm hoặc raw stack trace ra phía client.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Bắt các ngoại lệ nghiệp vụ tùy biến do hệ thống chủ động ném ra.
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException ex) {
        log.warn("Ngoại lệ nghiệp vụ xảy ra: [{}] - {}", ex.getStatus(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(ApiResponse.error(ex.getStatus().value(), ex.getMessage()));
    }

    /**
     * Bắt các lỗi vi phạm validation (@Valid) khi người dùng gửi sai định dạng request body.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        List<ApiResponse.ValidationErrorDetail> errors = new ArrayList<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.add(new ApiResponse.ValidationErrorDetail(
                    fieldError.getField(),
                    fieldError.getDefaultMessage()
            ));
        }
        log.warn("Lỗi xác thực dữ liệu đầu vào: {} trường vi phạm", errors.size());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.validationError(HttpStatus.BAD_REQUEST.value(), "Dữ liệu gửi lên không hợp lệ", errors));
    }

    /**
     * Bắt lỗi khi người dùng không có quyền truy cập tài nguyên (AccessDeniedException).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Truy cập bị từ chối: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Bạn không có quyền thực hiện thao tác này"));
    }

    /**
     * Bắt lỗi khi xác thực tài khoản thất bại (AuthenticationException).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex) {
        log.warn("Xác thực thất bại: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Thông tin xác thực không chính xác"));
    }

    /**
     * Chốt chặn cuối cùng: Bắt mọi ngoại lệ hệ thống không mong muốn (500 Internal Server Error).
     * Ghi log đầy đủ stack trace ở tầng Server, nhưng chỉ trả về thông điệp an toàn cho Client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Lỗi hệ thống nghiêm trọng chưa được phân loại", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau"));
    }
}
