package backend.repository;

import java.util.Locale;
import java.util.UUID;

import backend.entity.Task;
import backend.enums.TaskPriority;
import backend.enums.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {
    private TaskSpecifications() { }

    public static Specification<Task> dueTasks(UUID ownerId, UUID projectId, java.time.LocalDate today, boolean upcoming) {
        return (root, query, builder) -> {
            var project = root.join("project");
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(builder.equal(project.get("owner").get("id"), ownerId));
            if (projectId != null) { predicates.add(builder.equal(project.get("id"), projectId)); }
            predicates.add(builder.notEqual(root.get("status"), TaskStatus.DONE));
            predicates.add(upcoming
                    ? builder.between(root.get("dueDate"), today, today.plusDays(7))
                    : builder.lessThan(root.get("dueDate"), today));
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    public static Specification<Task> ownedTasks(UUID projectId, UUID ownerId, String search,
                                                TaskStatus status, TaskPriority priority) {
        return (root, query, builder) -> {
            var project = root.join("project");
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(builder.equal(project.get("id"), projectId));
            predicates.add(builder.equal(project.get("owner").get("id"), ownerId));
            if (search != null && !search.isBlank()) {
                String literal = search.strip().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
                predicates.add(builder.like(builder.lower(root.get("title")), "%" + literal + "%", '\\'));
            }
            if (status != null) { predicates.add(builder.equal(root.get("status"), status)); }
            if (priority != null) { predicates.add(builder.equal(root.get("priority"), priority)); }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
