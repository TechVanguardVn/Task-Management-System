package com.techvanguard.taskmanager.controller;

import com.techvanguard.taskmanager.dto.request.CreateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskStatusRequest;
import com.techvanguard.taskmanager.dto.response.ApiResponse;
import com.techvanguard.taskmanager.dto.response.PageResponse;
import com.techvanguard.taskmanager.dto.response.TaskDetailResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý toàn bộ các thao tác nghiệp vụ Quản lý công việc (Task CRUD).
 * Hỗ trợ tìm kiếm, lọc đa điều kiện, phân trang, chế độ Bảng Kanban kéo thả và chống IDOR 100%.
 */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tasks", description = "Các API quản lý công việc cá nhân và Bảng Kanban")
@SecurityRequirement(name = "BearerAuth")
public class TaskController {

    private final TaskService taskService;

    /**
     * Lấy danh sách công việc có phân trang, tìm kiếm theo từ khóa và lọc theo trạng thái/mức độ ưu tiên.
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách công việc (phân trang & lọc)",
               description = "Tìm kiếm theo tiêu đề, lọc theo status, priority và phân trang đồng bộ")
    public ResponseEntity<ApiResponse<PageResponse<TaskResponse>>> getTasks(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        PageResponse<TaskResponse> response = taskService.getTasks(
                currentUser.getId(), status, priority, search, page, size, sortBy, sortDir
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách công việc thành công"));
    }

    /**
     * Lấy danh sách toàn bộ công việc theo từng cột trạng thái phục vụ hiển thị Bảng Kanban.
     */
    @GetMapping("/kanban")
    @Operation(summary = "Lấy công việc theo trạng thái cho Bảng Kanban",
               description = "Trả về danh sách công việc theo status (TODO, IN_PROGRESS, DONE)")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getKanbanTasks(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) TaskStatus status) {

        List<TaskResponse> response = taskService.getKanbanTasks(currentUser.getId(), status);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy dữ liệu Bảng Kanban thành công"));
    }

    /**
     * Xem thông tin chi tiết một công việc (bao gồm cả Subtasks và Activity Logs).
     */
    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết công việc",
               description = "Lấy chi tiết một task cùng danh sách đầu việc con và lịch sử hoạt động")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> getTaskById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        TaskDetailResponse response = taskService.getTaskById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết công việc thành công"));
    }

    /**
     * Tạo mới một công việc.
     */
    @PostMapping
    @Operation(summary = "Tạo mới công việc",
               description = "Khởi tạo công việc mới, có thể đính kèm danh sách tiêu đề subtasks ban đầu")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateTaskRequest request) {

        TaskResponse response = taskService.createTask(request, currentUser.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo công việc mới thành công"));
    }

    /**
     * Cập nhật thông tin chi tiết một công việc.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật công việc",
               description = "Chỉnh sửa tiêu đề, mô tả, trạng thái, độ ưu tiên hoặc ngày hết hạn")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request) {

        TaskResponse response = taskService.updateTask(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật công việc thành công"));
    }

    /**
     * Cập nhật nhanh trạng thái công việc (dành riêng cho thao tác kéo thả trên Bảng Kanban).
     */
    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật nhanh trạng thái công việc (Kéo thả Kanban)",
               description = "Chuyển nhanh trạng thái TODO -> IN_PROGRESS -> DONE")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request) {

        TaskResponse response = taskService.updateTaskStatus(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái công việc thành công"));
    }

    /**
     * Xóa một công việc khỏi hệ thống.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa công việc",
               description = "Xóa vĩnh viễn công việc cùng toàn bộ subtasks liên quan")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        taskService.deleteTask(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Xóa công việc thành công"));
    }
}
