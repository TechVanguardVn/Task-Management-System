package com.techvanguard.taskmanager.config;

import com.techvanguard.taskmanager.entity.Subtask;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.entity.TaskActivityLog;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.enums.UserRole;
import com.techvanguard.taskmanager.repository.SubtaskRepository;
import com.techvanguard.taskmanager.repository.TaskActivityLogRepository;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Bộ nạp dữ liệu mẫu ban đầu (Data Seeder).
 * Tự động tạo tài khoản quản trị viên và dữ liệu công việc mẫu khi khởi động ứng dụng lần đầu,
 * giúp người chấm bài (Recruiter/Reviewer) kiểm thử ngay lập tức mà không cần tạo tay.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final TaskActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // Bước 1: Kiểm tra xem hệ thống đã có tài khoản nào chưa
        if (userRepository.count() > 0) {
            log.info("Cơ sở dữ liệu đã có dữ liệu người dùng, bỏ qua bước khởi tạo mẫu.");
            return;
        }

        log.info("Bắt đầu nạp dữ liệu mẫu cho bài test tuyển dụng TechVanguard...");

        // Bước 2: Tạo tài khoản Quản trị viên (Admin)
        User admin = User.builder()
                .email("admin@techvanguard.vn")
                .password(passwordEncoder.encode("Admin@123"))
                .fullName("Quản trị viên Hệ thống")
                .role(UserRole.ROLE_ADMIN)
                .build();
        admin = userRepository.save(admin);

        // Bước 3: Tạo tài khoản Người dùng tiêu chuẩn (Candidate Lê Hữu Văn)
        User user = User.builder()
                .email("user@techvanguard.vn")
                .password(passwordEncoder.encode("User@123"))
                .fullName("Lê Hữu Văn")
                .role(UserRole.ROLE_USER)
                .build();
        user = userRepository.save(user);

        log.info("Đã tạo 2 tài khoản mẫu: admin@techvanguard.vn và user@techvanguard.vn (Password: Admin@123 / User@123)");

        // Bước 4: Tạo danh sách 10 công việc mẫu với đầy đủ trạng thái và độ ưu tiên
        LocalDateTime now = LocalDateTime.now();

        List<Task> sampleTasks = new ArrayList<>();

        // Task 1: Thiết kế kiến trúc tổng thể
        sampleTasks.add(Task.builder()
                .title("Thiết kế kiến trúc hệ thống Task Management")
                .description("Phân tầng Backend Spring Boot 3 + Clean Architecture, Frontend React 18 + Vite.")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.HIGH)
                .dueDate(now.minusDays(2))
                .user(user)
                .build());

        // Task 2: Cấu hình cơ chế Stateless JWT
        sampleTasks.add(Task.builder()
                .title("Cấu hình Spring Security 6 với Stateless JWT")
                .description("Tích hợp JwtAuthenticationFilter, JwtAuthenticationEntryPoint và mã hóa BCrypt strength 12.")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.HIGH)
                .dueDate(now.minusDays(1))
                .user(user)
                .build());

        // Task 3: Tích hợp Redis Token Blacklist
        sampleTasks.add(Task.builder()
                .title("Tích hợp Redis Blacklist thu hồi JWT khi Logout")
                .description("Lưu trữ token đã đăng xuất vào Redis với thời gian TTL bằng đúng thời hạn còn lại của JWT.")
                .status(TaskStatus.DONE)
                .priority(TaskPriority.HIGH)
                .dueDate(now.plusDays(1))
                .user(user)
                .build());

        // Task 4: Xây dựng bảng Kanban kéo thả
        sampleTasks.add(Task.builder()
                .title("Xây dựng bảng Kanban kéo thả (Drag and Drop)")
                .description("Cho phép kéo thả trực quan giữa 3 cột TODO, IN_PROGRESS, DONE và cập nhật ngay lên API.")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .dueDate(now.plusDays(2))
                .user(user)
                .build());

        // Task 5: Triển khai Dashboard thống kê và Redis Caching
        sampleTasks.add(Task.builder()
                .title("Triển khai Dashboard số liệu thống kê năng suất")
                .description("Hiển thị tổng số việc, tỷ lệ hoàn thành, việc quá hạn và cache số liệu 5 phút trên Redis.")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.MEDIUM)
                .dueDate(now.plusDays(3))
                .user(user)
                .build());

        // Task 6: Tích hợp xuất dữ liệu CSV và JSON
        sampleTasks.add(Task.builder()
                .title("Tích hợp xuất báo cáo công việc CSV và JSON")
                .description("Hỗ trợ xuất file CSV kèm tiền tố UTF-8 BOM để Excel hiển thị tiếng Việt có dấu chuẩn xác.")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .dueDate(now.plusDays(4))
                .user(user)
                .build());

        // Task 7: Viết Unit Test và Integration Test
        sampleTasks.add(Task.builder()
                .title("Viết Unit Test cho tầng Service và Security")
                .description("Sử dụng JUnit 5, Mockito và AssertJ để kiểm thử toàn diện các luồng chính và edge cases.")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .dueDate(now.plusDays(5))
                .user(user)
                .build());

        // Task 8: Đóng gói Docker Compose
        sampleTasks.add(Task.builder()
                .title("Đóng gói môi trường triển khai bằng Docker Compose")
                .description("Cấu hình multi-stage build cho Spring Boot và Nginx React, kết nối PostgreSQL và Redis.")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .dueDate(now.plusDays(6))
                .user(admin)
                .build());

        // Task 9: Đánh giá bảo mật và tối ưu chỉ mục Database
        sampleTasks.add(Task.builder()
                .title("Kiểm toán bảo mật OWASP Top 10 và Indexing JPA")
                .description("Rà soát chống IDOR, SQL Injection, kiểm tra index trên khóa ngoại và các trường tìm kiếm.")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .dueDate(now.plusDays(7))
                .user(admin)
                .build());

        // Task 10: Soạn thảo tài liệu bàn giao README và Dev Notes
        sampleTasks.add(Task.builder()
                .title("Hoàn thiện tài liệu bàn giao và Sổ tay Kỹ thuật 5 phần")
                .description("Viết hướng dẫn khởi chạy chi tiết kèm tài khoản mẫu và các bài học kinh nghiệm chuyên sâu.")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .dueDate(now.plusDays(8))
                .user(user)
                .build());

        List<Task> savedTasks = taskRepository.saveAll(sampleTasks);

        // Bước 5: Thêm các đầu việc con (Subtasks) và lịch sử thao tác mẫu
        for (Task task : savedTasks) {
            // Thêm Subtasks
            List<Subtask> subtasks = new ArrayList<>();
            subtasks.add(Subtask.builder()
                    .title("Phân tích yêu cầu và định nghĩa Schema")
                    .isCompleted(task.getStatus() == TaskStatus.DONE)
                    .task(task)
                    .build());
            subtasks.add(Subtask.builder()
                    .title("Triển khai mã nguồn và viết kiểm thử")
                    .isCompleted(task.getStatus() == TaskStatus.DONE)
                    .task(task)
                    .build());
            subtasks.add(Subtask.builder()
                    .title("Code review và kiểm tra tuân thủ Clean Architecture")
                    .isCompleted(task.getStatus() == TaskStatus.DONE)
                    .task(task)
                    .build());
            subtaskRepository.saveAll(subtasks);

            // Thêm TaskActivityLog mẫu
            TaskActivityLog createLog = TaskActivityLog.builder()
                    .action("TASK_CREATED")
                    .description("Khởi tạo công việc mẫu: " + task.getTitle())
                    .task(task)
                    .user(task.getUser())
                    .build();
            activityLogRepository.save(createLog);

            if (task.getStatus() == TaskStatus.IN_PROGRESS || task.getStatus() == TaskStatus.DONE) {
                TaskActivityLog progressLog = TaskActivityLog.builder()
                        .action("STATUS_CHANGED")
                        .description("Chuyển trạng thái sang: " + task.getStatus().name())
                        .task(task)
                        .user(task.getUser())
                        .build();
                activityLogRepository.save(progressLog);
            }
        }

        log.info("Hoàn tất nạp dữ liệu mẫu! Tổng số công việc đã tạo: {}", savedTasks.size());
    }
}
