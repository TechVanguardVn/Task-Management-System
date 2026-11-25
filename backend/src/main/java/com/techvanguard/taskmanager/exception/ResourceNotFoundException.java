package com.techvanguard.taskmanager.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ ném ra khi không tìm thấy tài nguyên yêu cầu (User, Task, Subtask).
 * Tương ứng với mã phản hồi HTTP 404 NOT_FOUND.
 */
public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("Không tìm thấy %s với %s: '%s'", resourceName, fieldName, fieldValue), HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
