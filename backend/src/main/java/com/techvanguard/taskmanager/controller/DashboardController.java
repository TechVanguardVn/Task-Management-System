package com.techvanguard.taskmanager.controller;

import com.techvanguard.taskmanager.dto.response.ApiResponse;
import com.techvanguard.taskmanager.dto.response.DashboardMetricsResponse;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller cung cấp các API phân tích số liệu thống kê cho trang Dashboard.
 * Kết hợp cùng Redis Cache để tối ưu hóa hiệu năng phản hồi dưới 1ms.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dashboard", description = "Các API thống kê, phân tích hiệu suất công việc và Redis Cache")
@SecurityRequirement(name = "BearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Lấy các chỉ số thống kê công việc của người dùng hiện tại (tổng task, theo status, sắp tới hạn).
     */
    @GetMapping("/metrics")
    @Operation(summary = "Lấy số liệu thống kê Dashboard",
               description = "Trả về tổng số task, số lượng theo từng status, task sắp tới hạn và % hoàn thành (Cache Redis)")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getMetrics(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.debug("Gọi API GET /api/v1/dashboard/metrics cho User ID: {}", currentUser.getId());
        DashboardMetricsResponse response = dashboardService.getMetrics(currentUser.getId());

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy số liệu thống kê Dashboard thành công"));
    }
}
