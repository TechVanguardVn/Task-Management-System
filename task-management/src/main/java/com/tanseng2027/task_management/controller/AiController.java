package com.tanseng2027.task_management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tanseng2027.task_management.dto.request.AiParseTaskRequest;
import com.tanseng2027.task_management.dto.response.AiStatusResponse;
import com.tanseng2027.task_management.dto.response.AiTaskSuggestion;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.exception.ErrorResponse;
import com.tanseng2027.task_management.service.AiTaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "4. AI", description = "Tính năng AI (Google Gemini). Tắt khi server chưa cấu hình AI_API_KEY.")
@ApiResponse(responseCode = "401", description = "Chưa đăng nhập / token không hợp lệ", content = @Content)
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiTaskService aiTaskService;

    @Operation(summary = "Trạng thái tính năng AI", description = "Frontend dùng để quyết định có hiện các nút AI hay không.")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> status() {
        return ResponseEntity.ok(aiTaskService.status());
    }

    @Operation(summary = "Phân tích câu tự nhiên thành gợi ý task",
            description = """
                    Ví dụ: "Nộp báo cáo quý cho sếp trước 5h chiều thứ 6, gấp" → tiêu đề, mô tả, hạn (thứ Sáu tới), ưu tiên HIGH.

                    **Chỉ trả về gợi ý, không tạo task.** Người dùng kiểm tra lại rồi lưu bằng `POST /api/tasks`.
                    Nội dung câu được gửi tới Google Gemini - không nhập thông tin nhạy cảm.
                    """)
    @ApiResponse(responseCode = "200", description = "Gợi ý task")
    @ApiResponse(responseCode = "400", description = "Câu trống hoặc quá 500 ký tự",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Hết lượt AI (giới hạn mỗi giờ hoặc hạn mức của Gemini)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "502", description = "AI trả kết quả không hợp lệ",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "503", description = "Chưa cấu hình AI hoặc AI tạm thời không khả dụng",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @PostMapping("/parse-task")
    public ResponseEntity<AiTaskSuggestion> parseTask(@AuthenticationPrincipal User user,
                                                      @Valid @RequestBody AiParseTaskRequest request) {
        return ResponseEntity.ok(aiTaskService.parseTask(user, request.text()));
    }
}
