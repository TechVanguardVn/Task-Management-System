package com.techvanguard.taskmanager.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ ném ra khi tài nguyên tạo mới đã tồn tại giá trị duy nhất (Unique constraint như Email).
 * Tương ứng với mã phản hồi HTTP 400 BAD_REQUEST hoặc 409 CONFLICT.
 */
public class DuplicateResourceException extends ApiException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
