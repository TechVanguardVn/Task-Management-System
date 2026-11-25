package com.techvanguard.taskmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Lớp khởi chạy chính của ứng dụng Task Management System.
 * Kích hoạt Spring Data JPA Auditing và Spring Cache Abstraction.
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
public class TaskManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskManagerApplication.class, args);
    }
}
