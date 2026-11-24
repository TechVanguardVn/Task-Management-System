package backend.controller;

import java.util.UUID;

import backend.dto.DashboardSummaryResponse;
import backend.dto.PageResponse;
import backend.dto.TaskResponse;
import backend.security.AuthPrincipal;
import backend.service.DashboardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboard;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal,
                                             @RequestParam(required = false) UUID projectId) {
        return dashboard.summary(principal, projectId);
    }

    @GetMapping("/upcoming")
    public PageResponse<TaskResponse> upcoming(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal,
                                               @RequestParam(required = false) UUID projectId,
                                               @RequestParam(defaultValue = "0") @Min(0) int page,
                                               @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return dashboard.upcoming(principal, projectId, page, size);
    }

    @GetMapping("/overdue")
    public PageResponse<TaskResponse> overdue(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal,
                                              @RequestParam(required = false) UUID projectId,
                                              @RequestParam(defaultValue = "0") @Min(0) int page,
                                              @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return dashboard.overdue(principal, projectId, page, size);
    }
}
