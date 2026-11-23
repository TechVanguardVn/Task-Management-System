package com.techvanguard.taskmanager.repository;

import com.techvanguard.taskmanager.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Tầng truy xuất dữ liệu cho bảng subtasks.
 */
@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    /**
     * Tìm kiếm subtask theo ID và xác minh quyền sở hữu thông qua task cha của người dùng.
     * SECURITY: Kiểm tra s.task.user.id = :userId để chống lỗi IDOR khi người dùng tick chọn hoàn thành.
     */
    @Query("SELECT s FROM Subtask s WHERE s.id = :id AND s.task.user.id = :userId")
    Optional<Subtask> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
