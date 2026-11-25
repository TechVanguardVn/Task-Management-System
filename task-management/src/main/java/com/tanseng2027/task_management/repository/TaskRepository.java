package com.tanseng2027.task_management.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.tanseng2027.task_management.entity.Task;
import com.tanseng2027.task_management.entity.TaskStatus;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    // Lấy 1 task nhưng chỉ khi task đó thuộc về user → chống xem/sửa/xóa task của người khác
    Optional<Task> findByIdAndUserId(Long id, Long userId);

    // ===== Dùng cho Dashboard =====
    long countByUser_Id(Long userId);

    long countByUser_IdAndStatus(Long userId, TaskStatus status);

    // Task quá hạn: hạn < hôm nay và chưa xong
    long countByUser_IdAndStatusNotAndDueDateBefore(Long userId, TaskStatus status, LocalDate date);

    // Task sắp đến hạn: hạn trong khoảng [from, to] và chưa xong, hạn gần nhất lên trước
    List<Task> findByUser_IdAndStatusNotAndDueDateBetweenOrderByDueDateAscIdAsc(
        Long userId, TaskStatus status, LocalDate from, LocalDate to);
}
