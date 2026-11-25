package com.techvanguard.taskmanager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Cấu trúc phân trang chuẩn mực cho các truy vấn danh sách dữ liệu lớn.
 * Ngăn chặn việc tải toàn bộ bảng làm tràn bộ nhớ (Out-Of-Memory).
 *
 * @param <T> Kiểu dữ liệu của các phần tử trong trang
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /**
     * Danh sách các phần tử dữ liệu trong trang hiện tại.
     */
    private List<T> content;

    /**
     * Số thứ tự trang hiện tại (bắt đầu từ 0).
     */
    private int pageNumber;

    /**
     * Kích thước số phần tử tối đa trên một trang.
     */
    private int pageSize;

    /**
     * Tổng số lượng phần tử tìm thấy thỏa mãn điều kiện lọc.
     */
    private long totalElements;

    /**
     * Tổng số lượng trang có thể phân tách.
     */
    private int totalPages;

    /**
     * Cờ đánh dấu đây có phải là trang dữ liệu cuối cùng hay không.
     */
    private boolean isLast;

    /**
     * Phương thức tiện ích chuyển đổi nhanh từ Spring Data Page<E> sang PageResponse<T>.
     */
    public static <T> PageResponse<T> of(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }
}
