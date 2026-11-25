package com.techvanguard.taskmanager.enums;

/**
 * Định nghĩa mức độ ưu tiên của công việc (Task Priority).
 */
public enum TaskPriority {
    LOW("Thấp"),
    MEDIUM("Trung bình"),
    HIGH("Cao");

    private final String description;

    TaskPriority(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
