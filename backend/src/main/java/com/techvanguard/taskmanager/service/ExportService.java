package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.response.TaskResponse;

import java.util.List;

/**
 * Giao diện dịch vụ trích xuất và xuất dữ liệu báo cáo (Export).
 */
public interface ExportService {

    /**
     * Xuất danh sách công việc của người dùng thành file CSV (UTF-8 có BOM chống lỗi font tiếng Việt trên Excel).
     *
     * @param userId ID người dùng sở hữu
     * @return Mảng byte chứa nội dung file CSV
     */
    byte[] exportTasksToCsv(Long userId);

    /**
     * Xuất danh sách công việc dạng dữ liệu có cấu trúc JSON để phục vụ sao lưu hoặc tích hợp.
     *
     * @param userId ID người dùng sở hữu
     * @return Danh sách DTO công việc
     */
    List<TaskResponse> exportTasksToJson(Long userId);
}
