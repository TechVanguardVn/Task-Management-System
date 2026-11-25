package com.techvanguard.taskmanager.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Lớp ngoại lệ cơ sở cho toàn bộ các ngoại lệ nghiệp vụ trong ứng dụng.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
