package com.huulu.task_management.repository;

import com.huulu.task_management.entity.Task;
import com.huulu.task_management.entity.TaskPriority;
import com.huulu.task_management.entity.TaskStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByIdAndUserId(Long id, Long userId);

        @Query("""
                        select t from Task t
                        where t.user.id = :userId
                              and (:keyword = '' or lower(t.title) like lower(concat('%', :keyword, '%')))
                            and (:status is null or t.status = :status)
                            and (:priority is null or t.priority = :priority)
                        """)
        Page<Task> searchByUser(
                        @Param("userId") Long userId,
                        @Param("keyword") String keyword,
                        @Param("status") TaskStatus status,
                        @Param("priority") TaskPriority priority,
                        Pageable pageable);

    @Query("""
        select t.status, count(t) from Task t
        where t.user.id = :userId
        group by t.status
        """)
    List<Object[]> countByStatusForUser(@Param("userId") Long userId);

    @Query("""
        select t from Task t
        where t.user.id = :userId
          and t.status <> :doneStatus
          and t.dueDate between :fromDate and :toDate
        order by t.dueDate asc
        """)
    List<Task> findUpcomingTasks(
        @Param("userId") Long userId,
        @Param("doneStatus") TaskStatus doneStatus,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable);
}
