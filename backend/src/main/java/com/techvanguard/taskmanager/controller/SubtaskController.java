package com.techvanguard.taskmanager.controller;

import com.techvanguard.taskmanager.dto.request.CreateSubtaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateSubtaskRequest;
import com.techvanguard.taskmanager.dto.response.ApiResponse;
import com.techvanguard.taskmanager.dto.response.SubtaskResponse;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.SubtaskService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các thao tác trên đầu việc con (Checklist Subtasks).
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Subtasks", description = "Các API quản lý danh sách đầu việc con (Checklist)")
@SecurityRequirement(name = "BearerAuth")
public class SubtaskController {

    private final SubtaskService subtaskService;

    /**
     * Thêm một đầu việc con mới vào một task cụ thể.
     */
    @PostMapping("/tasks/{taskId}/subtasks")
    @Operation(summary = "Thêm đầu việc con vào công việc",
               description = "Tạo một subtask mới nằm trong task cha")
    public ResponseEntity<ApiResponse<SubtaskResponse>> addSubtask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateSubtaskRequest request) {

        SubtaskResponse response = subtaskService.addSubtask(taskId, request, currentUser.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Thêm đầu việc con thành công"));
    }

    /**
     * Cập nhật thông tin của một đầu việc con.
     */
    @PutMapping("/subtasks/{subtaskId}")
    @Operation(summary = "Cập nhật đầu việc con",
               description = "Chỉnh sửa tiêu đề hoặc trạng thái hoàn thành của subtask")
    public ResponseEntity<ApiResponse<SubtaskResponse>> updateSubtask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long subtaskId,
            @Valid @RequestBody UpdateSubtaskRequest request) {

        SubtaskResponse response = subtaskService.updateSubtask(subtaskId, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật đầu việc con thành công"));
    }

    /**
     * Đổi nhanh trạng thái hoàn thành (Toggle check/uncheck) của một đầu việc con.
     */
    @PatchMapping("/subtasks/{subtaskId}/toggle")
    @Operation(summary = "Đổi trạng thái hoàn thành của đầu việc con",
               description = "Tick chọn hoặc bỏ tick hoàn thành công việc con")
    public ResponseEntity<ApiResponse<SubtaskResponse>> toggleSubtask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long subtaskId) {

        SubtaskResponse response = subtaskService.toggleSubtask(subtaskId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái thành công"));
    }

    /**
     * Xóa một đầu việc con khỏi task.
     */
    @DeleteMapping("/subtasks/{subtaskId}")
    @Operation(summary = "Xóa đầu việc con",
               description = "Xóa một subtask khỏi danh sách checklist")
    public ResponseEntity<ApiResponse<Void>> deleteSubtask(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long subtaskId) {

        subtaskService.deleteSubtask(subtaskId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Xóa đầu việc con thành công"));
    }
}
