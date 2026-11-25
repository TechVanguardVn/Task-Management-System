package com.techvanguard.taskmanager.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ ném ra khi thông tin xác thực bị thiếu, không hợp lệ hoặc đã hết hạn.
 * Tương ứng với mã phản hồi HTTP 401 UNAUTHORIZED.
 */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
