package com.tanseng2027.task_management.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.tanseng2027.task_management.ai.AiException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 - không tìm thấy task (hoặc task của người khác)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    // 409 - dữ liệu bị trùng (vd: đăng ký email đã tồn tại)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), null);
    }

    // Lỗi tính năng AI: chưa cấu hình (503), hết lượt (429), AI lỗi (503), kết quả sai (502)
    @ExceptionHandler(AiException.class)
    public ResponseEntity<ErrorResponse> handleAi(AiException ex) {
        HttpStatus status = switch (ex.getReason()) {
            case NOT_CONFIGURED, UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            case RATE_LIMITED -> HttpStatus.TOO_MANY_REQUESTS;
            case INVALID_OUTPUT -> HttpStatus.BAD_GATEWAY;
        };
        return build(status, ex.getMessage(), null);
    }

    // 400 - body không qua được @Valid (vd: title để trống)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(err -> errors.putIfAbsent(err.getField(), err.getDefaultMessage()));
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", errors);
    }

    // 400 - JSON sai cú pháp, sai giá trị enum (vd: status = "ABC"), sai định dạng ngày
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST,
                "Body không hợp lệ: kiểm tra JSON, giá trị status/priority và định dạng ngày (yyyy-MM-dd)", null);
    }

    // 400 - query param / path variable sai kiểu (vd: ?status=ABC, /api/tasks/abc)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return build(HttpStatus.BAD_REQUEST,
                "Giá trị không hợp lệ cho tham số '" + ex.getName() + "': " + ex.getValue(), null);
    }

    // 400 - sort theo field không tồn tại (vd: ?sort=abc)
    @ExceptionHandler(PropertyReferenceException.class)
    public ResponseEntity<ErrorResponse> handleBadSort(PropertyReferenceException ex) {
        return build(HttpStatus.BAD_REQUEST, "Không thể sắp xếp theo field '" + ex.getPropertyName() + "'", null);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, Map<String, String> errors) {
        return ResponseEntity.status(status)
                .body(ErrorResponse.of(status.value(), status.getReasonPhrase(), message, errors));
    }
}
