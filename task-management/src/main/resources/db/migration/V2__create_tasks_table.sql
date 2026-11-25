-- V2: Bảng công việc
-- Khớp với entity/Task.java, TaskStatus.java, TaskPriority.java
-- Cú pháp chạy được trên cả MySQL 8 (Docker) và H2 (chạy local / test)

CREATE TABLE tasks (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    priority     VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    due_date     DATE,
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    user_id      BIGINT       NOT NULL,

    CONSTRAINT pk_tasks PRIMARY KEY (id),

    -- Mỗi task thuộc về 1 user; xóa user thì xóa luôn task của user đó
    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    -- Chỉ cho phép các giá trị có trong enum
    CONSTRAINT ck_tasks_status
        CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT ck_tasks_priority
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

-- Index cho các truy vấn hay dùng: lọc task theo user + trạng thái / ưu tiên / hạn.
-- (Cột user_id đứng đầu nên các index này cũng phục vụ luôn truy vấn chỉ lọc theo user_id.)
CREATE INDEX idx_tasks_user_status   ON tasks (user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks (user_id, priority);
CREATE INDEX idx_tasks_user_due_date ON tasks (user_id, due_date);
