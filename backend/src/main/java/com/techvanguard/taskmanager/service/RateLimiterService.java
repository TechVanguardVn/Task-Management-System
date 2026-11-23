package com.techvanguard.taskmanager.service;

/**
 * Giao diện dịch vụ giới hạn tần suất yêu cầu (Rate Limiting).
 * Chống tấn công dò quét mật khẩu vét cạn (Brute-force) và từ chối dịch vụ (DoS) tại các endpoint nhạy cảm.
 */
public interface RateLimiterService {

    /**
     * Kiểm tra xem một khóa định danh (IP hoặc email) có được phép thực hiện hành động tiếp theo hay không.
     *
     * @param key Khóa định danh duy nhất (ví dụ: "login:vanlh25@gmail.com")
     * @param maxRequests Số lượng yêu cầu tối đa cho phép trong một khung thời gian
     * @param windowSeconds Thời gian của khung giới hạn tính bằng giây
     * @return true nếu số lượng yêu cầu vẫn nằm trong giới hạn; false nếu đã vượt ngưỡng cho phép
     */
    boolean isAllowed(String key, int maxRequests, long windowSeconds);
}
