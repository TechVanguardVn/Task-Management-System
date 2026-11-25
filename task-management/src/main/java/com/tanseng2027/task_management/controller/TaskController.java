package com.tanseng2027.task_management.controller;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tanseng2027.task_management.dto.request.TaskRequest;
import com.tanseng2027.task_management.dto.response.PageResponse;
import com.tanseng2027.task_management.dto.response.TaskResponse;
import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.exception.ErrorResponse;
import com.tanseng2027.task_management.service.TaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "2. Tasks", description = "CRUD task, tìm kiếm, lọc, phân trang. Chỉ thao tác được trên task của chính mình.")
@ApiResponse(responseCode = "401", description = "Chưa đăng nhập / token không hợp lệ", content = @Content)
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @Operation(summary = "Danh sách task (tìm kiếm, lọc, phân trang)",
            description = """
                    Các tham số đều không bắt buộc, có thể kết hợp với nhau.

                    - `page` bắt đầu từ 0, `size` mặc định 10 (tối đa 100)
                    - `sort` dạng `field,asc|desc`, ví dụ `dueDate,asc`. Mặc định `createdAt,desc`.
                      Field hợp lệ: `title`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`
                    """)
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Giá trị status/priority hoặc field sort không hợp lệ",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @GetMapping
    public ResponseEntity<PageResponse<TaskResponse>> getTasks(
            @AuthenticationPrincipal User user,
            @Parameter(description = "Tìm theo tiêu đề (không phân biệt hoa thường)", example = "api")
            @RequestParam(name = "search", required = false) String search,
            @Parameter(description = "Lọc theo trạng thái")
            @RequestParam(name = "status", required = false) TaskStatus status,
            @Parameter(description = "Lọc theo mức ưu tiên")
            @RequestParam(name = "priority", required = false) TaskPriority priority,
            @ParameterObject
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(taskService.getTasks(user, search, status, priority, pageable));
    }

    @Operation(summary = "Xem chi tiết 1 task")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy task (hoặc task thuộc user khác)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@AuthenticationPrincipal User user,
                                                @PathVariable("id") Long id) {
        return ResponseEntity.ok(taskService.getTask(user, id));
    }

    @Operation(summary = "Tạo task",
            description = "Không gửi `status` / `priority` thì mặc định là `TODO` / `MEDIUM`.")
    @ApiResponse(responseCode = "201", description = "Tạo thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ (vd: tiêu đề trống)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@AuthenticationPrincipal User user,
                                                   @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(user, request));
    }

    @Operation(summary = "Cập nhật task",
            description = """
                    Thay thế toàn bộ thông tin task:
                    - `description`, `dueDate` không gửi (hoặc null) sẽ bị xóa
                    - `status`, `priority` không gửi thì giữ nguyên giá trị cũ
                    """)
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy task (hoặc task thuộc user khác)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@AuthenticationPrincipal User user,
                                                   @PathVariable("id") Long id,
                                                   @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(user, id, request));
    }

    @Operation(summary = "Xóa task")
    @ApiResponse(responseCode = "204", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy task (hoặc task thuộc user khác)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@AuthenticationPrincipal User user,
                                           @PathVariable("id") Long id) {
        taskService.deleteTask(user, id);
        return ResponseEntity.noContent().build();
    }
}
