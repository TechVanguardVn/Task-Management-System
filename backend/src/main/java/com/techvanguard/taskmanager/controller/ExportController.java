package com.techvanguard.taskmanager.controller;

import com.techvanguard.taskmanager.dto.response.ApiResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.security.UserPrincipal;
import com.techvanguard.taskmanager.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý việc xuất dữ liệu công việc ra file CSV và JSON.
 */
@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Export", description = "Các API xuất báo cáo công việc ra CSV và sao lưu JSON")
@SecurityRequirement(name = "BearerAuth")
public class ExportController {

    private final ExportService exportService;

    /**
     * Xuất danh sách công việc của người dùng hiện tại thành file CSV (UTF-8).
     */
    @GetMapping("/tasks/csv")
    @Operation(summary = "Xuất danh sách công việc ra file CSV",
               description = "Tải về file tasks.csv chuẩn UTF-8 tương thích tốt với Microsoft Excel")
    public ResponseEntity<byte[]> exportTasksCsv(@AuthenticationPrincipal UserPrincipal currentUser) {
        log.info("Gọi endpoint xuất file CSV cho User ID: {}", currentUser.getId());
        byte[] csvData = exportService.exportTasksToCsv(currentUser.getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tasks.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    /**
     * Xuất danh sách công việc của người dùng hiện tại dạng JSON có cấu trúc.
     */
    @GetMapping("/tasks/json")
    @Operation(summary = "Xuất danh sách công việc dạng JSON",
               description = "Lấy toàn bộ công việc dạng JSON phục vụ tích hợp hoặc sao lưu")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> exportTasksJson(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<TaskResponse> response = exportService.exportTasksToJson(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Xuất dữ liệu JSON thành công"));
    }
}
