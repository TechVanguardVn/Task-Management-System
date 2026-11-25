package com.tanseng2027.task_management.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.tanseng2027.task_management.entity.Task;
import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;

import jakarta.persistence.criteria.Predicate;

public final class TaskSpecification {

    private TaskSpecification() {
    }

    public static Specification<Task> filter(Long userId, String keyword,
                                             TaskStatus status, TaskPriority priority) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Luôn chỉ lấy task của user đang đăng nhập
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            // Tìm theo tiêu đề, không phân biệt hoa thường
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + escapeLike(keyword.trim().toLowerCase()) + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern, '\\'));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    // Để người dùng tìm được cả ký tự % và _ (không bị hiểu là ký tự đại diện của LIKE)
    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
