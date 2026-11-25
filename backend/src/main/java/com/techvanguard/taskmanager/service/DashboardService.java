package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.response.DashboardMetricsResponse;

/**
 * Giao diện dịch vụ tổng hợp số liệu Dashboard thống kê.
 */
public interface DashboardService {

    /**
     * Lấy toàn bộ số liệu thống kê tổng quan và danh sách công việc sắp đến hạn.
     * Sử dụng Redis Cache để tăng tốc độ phản hồi.
     *
     * @param userId ID người dùng đang đăng nhập
     * @return DashboardMetricsResponse DTO chứa dữ liệu tổng hợp
     */
    DashboardMetricsResponse getMetrics(Long userId);
}
