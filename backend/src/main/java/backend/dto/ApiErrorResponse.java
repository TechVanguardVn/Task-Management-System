package backend.dto;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpStatus;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<ValidationError> validationErrors) {

    public static ApiErrorResponse of(HttpStatusCode status, String message, String path) {
        return of(status, message, path, List.of());
    }

    public static ApiErrorResponse of(HttpStatusCode status, String message, String path,
                                      List<ValidationError> validationErrors) {
        HttpStatus resolved = HttpStatus.resolve(status.value());
        return new ApiErrorResponse(Instant.now(), status.value(),
                resolved == null ? "HTTP Error" : resolved.getReasonPhrase(),
                message, path, List.copyOf(validationErrors));
    }

    public record ValidationError(String field, String message) {
    }
}
