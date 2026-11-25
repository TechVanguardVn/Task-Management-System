package com.techvanguard.taskmanager.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ ném ra khi yêu cầu từ Client chứa dữ liệu không hợp lệ hoặc vi phạm logic nghiệp vụ.
 * Tương ứng với mã phản hồi HTTP 400 BAD_REQUEST.
 */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
