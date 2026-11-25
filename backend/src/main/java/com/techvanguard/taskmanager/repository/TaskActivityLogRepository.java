package com.techvanguard.taskmanager.repository;

import com.techvanguard.taskmanager.entity.TaskActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Tầng truy xuất dữ liệu cho bảng task_activity_logs (Audit Trail).
 */
@Repository
public interface TaskActivityLogRepository extends JpaRepository<TaskActivityLog, Long> {

    /**
     * Lấy lịch sử hoạt động của một task cụ thể thuộc về người dùng, sắp xếp mới nhất lên đầu.
     */
    @Query("SELECT a FROM TaskActivityLog a WHERE a.task.id = :taskId AND a.user.id = :userId ORDER BY a.createdAt DESC")
    List<TaskActivityLog> findByTaskIdAndUserId(@Param("taskId") Long taskId, @Param("userId") Long userId);

    /**
     * Lấy tối đa N hoạt động gần nhất của người dùng trên toàn hệ thống (phục vụ hiển thị ngăn kéo Activity Drawer).
     */
    @Query("SELECT a FROM TaskActivityLog a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    List<TaskActivityLog> findRecentActivitiesByUserId(@Param("userId") Long userId, Pageable pageable);
}
