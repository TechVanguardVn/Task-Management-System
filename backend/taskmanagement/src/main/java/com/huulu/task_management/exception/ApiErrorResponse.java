package com.huulu.task_management.exception;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        Map<String, String> fieldErrors
) {
    public static ApiErrorResponse of(int status, String error) {
        return new ApiErrorResponse(Instant.now(), status, error, Map.of());
    }

    public static ApiErrorResponse validation(Map<String, String> fieldErrors) {
        return new ApiErrorResponse(Instant.now(), 400, "Validation failed", fieldErrors);
    }
}
