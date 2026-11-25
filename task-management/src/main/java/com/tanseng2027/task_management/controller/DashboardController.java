package com.tanseng2027.task_management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tanseng2027.task_management.dto.response.DashboardStatsResponse;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.service.DashboardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "3. Dashboard", description = "Thống kê task của user đang đăng nhập")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Thống kê task",
            description = """
                    Tổng số task, số task theo từng trạng thái, số task quá hạn
                    và danh sách task **chưa hoàn thành** có hạn trong `days` ngày tới (hạn gần nhất lên trước).
                    """)
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / token không hợp lệ", content = @Content)
    @GetMapping
    public ResponseEntity<DashboardStatsResponse> getStats(
            @AuthenticationPrincipal User user,
            @Parameter(description = "Số ngày tới để lấy task sắp đến hạn (1..30, ngoài khoảng sẽ tự giới hạn)", example = "7")
            @RequestParam(name = "days", defaultValue = "" + DashboardService.DEFAULT_UPCOMING_DAYS) int days) {
        return ResponseEntity.ok(dashboardService.getStats(user, days));
    }
}
