package com.techvanguard.taskmanager.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ ném ra khi người dùng không có quyền truy cập vào tài nguyên (Chống IDOR).
 * Tương ứng với mã phản hồi HTTP 403 FORBIDDEN.
 */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
