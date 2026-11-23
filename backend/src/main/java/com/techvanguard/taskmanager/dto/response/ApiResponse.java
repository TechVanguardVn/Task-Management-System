package com.techvanguard.taskmanager.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cấu trúc đóng gói phản hồi chuẩn mực cho 100% các RESTful API endpoints.
 * Đảm bảo tính nhất quán dữ liệu giữa Backend và Client.
 *
 * @param <T> Kiểu dữ liệu của payload trả về
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /**
     * Trạng thái thành công của thao tác nghiệp vụ.
     */
    private boolean success;

    /**
     * Mã trạng thái HTTP chuẩn (200, 201, 400, 404, 500...).
     */
    private int code;

    /**
     * Thông điệp phản hồi thân thiện với người dùng và lập trình viên Frontend.
     */
    private String message;

    /**
     * Dữ liệu kết quả thực thi (payload).
     */
    private T data;

    /**
     * Danh sách chi tiết các lỗi validation (nếu có).
     */
    private List<ValidationErrorDetail> errors;

    /**
     * Mốc thời gian hệ thống xử lý phản hồi.
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Tạo nhanh phản hồi thành công kèm dữ liệu.
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code(200)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Tạo nhanh phản hồi thành công không kèm dữ liệu trả về.
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code(200)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Tạo phản hồi lỗi với mã code và thông báo tùy biến.
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Tạo phản hồi lỗi kèm danh sách các trường vi phạm validation.
     */
    public static <T> ApiResponse<T> validationError(int code, String message, List<ValidationErrorDetail> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Cấu trúc thông tin chi tiết lỗi validation từng trường dữ liệu.
     */
    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ValidationErrorDetail {
        private String field;
        private String detail;
    }
}
