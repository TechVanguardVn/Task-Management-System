package com.techvanguard.taskmanager.repository;

import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Tầng truy xuất dữ liệu cho bảng tasks.
 * Triệt tiêu hoàn toàn lỗi N+1 Query bằng JOIN FETCH và bảo vệ dữ liệu chống IDOR 100%.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Tìm kiếm và lọc danh sách công việc của người dùng hiện tại có phân trang.
     * SECURITY: Điều kiện t.user.id = :userId bắt buộc phải có để chống IDOR.
     * Sử dụng câu lệnh JPQL linh hoạt cho phép status, priority, keyword có thể null.
     */
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:priority IS NULL OR t.priority = :priority) " +
           "AND (:keyword = '' OR LOWER(t.title) LIKE :keyword OR LOWER(COALESCE(t.description, '')) LIKE :keyword)")
    Page<Task> findByFilters(@Param("userId") Long userId,
                             @Param("status") TaskStatus status,
                             @Param("priority") TaskPriority priority,
                             @Param("keyword") String keyword,
                             Pageable pageable);

    /**
     * Lấy toàn bộ danh sách công việc của một người dùng theo trạng thái cụ thể (phục vụ hiển thị Bảng Kanban).
     * Sắp xếp theo ngày cập nhật mới nhất.
     */
    List<Task> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, TaskStatus status);

    /**
     * Lấy toàn bộ danh sách công việc của người dùng (phục vụ xuất file CSV / JSON).
     */
    List<Task> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Tìm kiếm một công việc theo ID và phải thuộc quyền sở hữu của người dùng hiện tại.
     * Chống IDOR: Ngăn chặn người dùng A xem hoặc chỉnh sửa task của người dùng B.
     */
    Optional<Task> findByIdAndUserId(Long id, Long userId);

    /**
     * Nạp chi tiết công việc kèm theo toàn bộ Subtasks trong 1 câu SQL duy nhất bằng LEFT JOIN FETCH.
     * Tối ưu hiệu năng: Triệt tiêu bài toán N+1 Query khi mở xem chi tiết công việc.
     */
    @Query("SELECT t FROM Task t " +
           "LEFT JOIN FETCH t.subtasks " +
           "WHERE t.id = :id AND t.user.id = :userId")
    Optional<Task> findByIdAndUserIdWithSubtasks(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * Đếm tổng số lượng công việc theo từng trạng thái phục vụ tính toán số liệu Dashboard.
     */
    long countByUserIdAndStatus(Long userId, TaskStatus status);

    /**
     * Đếm tổng số lượng công việc mà người dùng đang sở hữu.
     */
    long countByUserId(Long userId);

    /**
     * Lấy danh sách tối đa 5 công việc sắp đến hạn trong khoảng thời gian xác định (phục vụ widget Dashboard).
     */
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
           "AND t.status != :doneStatus " +
           "AND t.dueDate IS NOT NULL " +
           "AND t.dueDate >= :startDateTime AND t.dueDate <= :endDateTime " +
           "ORDER BY t.dueDate ASC")
    List<Task> findUpcomingTasks(@Param("userId") Long userId,
                                 @Param("doneStatus") TaskStatus doneStatus,
                                 @Param("startDateTime") LocalDateTime startDateTime,
                                 @Param("endDateTime") LocalDateTime endDateTime,
                                 Pageable pageable);
}
