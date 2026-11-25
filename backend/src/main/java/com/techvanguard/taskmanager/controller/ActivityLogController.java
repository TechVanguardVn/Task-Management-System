package com.techvanguard.taskmanager.controller;

import com.techvanguard.taskmanager.dto.response.ApiResponse;
import com.techvanguard.taskmanager.dto.response.TaskActivityLogResponse;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.TaskActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller tra cứu lịch sử thao tác (Audit Trail) của người dùng.
 * Phục vụ việc hiển thị ngăn kéo Activity Drawer trên Frontend.
 */
@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Activities", description = "Các API tra cứu lịch sử nhật ký hoạt động (Audit Trail)")
@SecurityRequirement(name = "BearerAuth")
public class ActivityLogController {

    private final TaskActivityLogService activityLogService;

    /**
     * Lấy danh sách các hoạt động gần đây nhất của người dùng hiện tại trên toàn hệ thống.
     */
    @GetMapping("/recent")
    @Operation(summary = "Lấy nhật ký hoạt động gần đây",
               description = "Hiển thị tối đa 20 hoạt động mới nhất của người dùng cho ngăn kéo Activity Drawer")
    public ResponseEntity<ApiResponse<List<TaskActivityLogResponse>>> getRecentActivities(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "20") int limit) {

        List<TaskActivityLogResponse> response = activityLogService.getRecentActivities(currentUser.getId(), limit);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử hoạt động thành công"));
    }

    /**
     * Lấy toàn bộ lịch sử thay đổi của một task cụ thể.
     */
    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "Lấy lịch sử thay đổi của một công việc cụ thể",
               description = "Hiển thị timeline các bước thay đổi trạng thái và nội dung của một task")
    public ResponseEntity<ApiResponse<List<TaskActivityLogResponse>>> getLogsByTaskId(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long taskId) {

        List<TaskActivityLogResponse> response = activityLogService.getLogsByTaskId(taskId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử công việc thành công"));
    }
}
