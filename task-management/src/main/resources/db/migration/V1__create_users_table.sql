-- V1: Bảng người dùng
-- Khớp với entity/User.java
-- Cú pháp chạy được trên cả MySQL 8 (Docker) và H2 (chạy local / test)

CREATE TABLE users (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,   -- lưu chuỗi BCrypt, không lưu mật khẩu thô
    full_name  VARCHAR(255) NOT NULL,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);
