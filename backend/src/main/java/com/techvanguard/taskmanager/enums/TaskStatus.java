package com.techvanguard.taskmanager.enums;

/**
 * Định nghĩa trạng thái vòng đời của một công việc (Task).
 */
public enum TaskStatus {
    TODO("Chưa bắt đầu"),
    IN_PROGRESS("Đang thực hiện"),
    DONE("Đã hoàn thành");

    private final String description;

    TaskStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
