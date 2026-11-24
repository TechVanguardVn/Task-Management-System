package backend.exception;

import java.util.ArrayList;

import backend.dto.ApiErrorResponse;
import backend.dto.ApiErrorResponse.ValidationError;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(BusinessException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getStatus()).body(ApiErrorResponse.of(
                exception.getStatus(), exception.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiErrorResponse.of(
                HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler({ConcurrencyFailureException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ApiErrorResponse> handleDatabaseConflict(Exception exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiErrorResponse.of(
                HttpStatus.CONFLICT, "Request conflicts with the current data state", request.getRequestURI()));
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthException(AuthException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getStatus()).body(ApiErrorResponse.of(
                exception.getStatus(), exception.getMessage(), request.getRequestURI()));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        var errors = new ArrayList<ValidationError>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.add(new ValidationError(error.getField(), error.getDefaultMessage())));
        exception.getBindingResult().getGlobalErrors().forEach(error ->
                errors.add(new ValidationError(error.getObjectName(), error.getDefaultMessage())));
        return new ResponseEntity<>(ApiErrorResponse.of(status, "Request validation failed",
                path(request), errors), headers, status);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception exception, Object body, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String message = status.is5xxServerError() ? "An unexpected error occurred" : "Request could not be processed";
        return new ResponseEntity<>(ApiErrorResponse.of(status, message, path(request)), headers, status);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception for {} {}", request.getMethod(), request.getRequestURI(), exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request.getRequestURI()));
    }

    private String path(WebRequest request) {
        return ((ServletWebRequest) request).getRequest().getRequestURI();
    }
}
