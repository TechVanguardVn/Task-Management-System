package com.techvanguard.taskmanager.service;

/**
 * Giao diện dịch vụ quản lý danh sách đen các JWT Token đã bị thu hồi (Blacklist).
 * Giải quyết triệt để bài toán đăng xuất của kiến trúc JWT Stateless.
 */
public interface TokenBlacklistService {

    /**
     * Đưa một token vào danh sách đen trong Redis kèm thời gian sống (TTL) tương ứng.
     *
     * @param token Chuỗi JWT Token cần vô hiệu hóa
     * @param remainingExpirationMs Thời gian còn lại của token trước khi tự hủy (milli-giây)
     */
    void blacklistToken(String token, long remainingExpirationMs);

    /**
     * Kiểm tra xem token này đã bị người dùng chủ động đăng xuất trước đó hay chưa.
     *
     * @param token Chuỗi JWT Token cần kiểm tra
     * @return true nếu token đã nằm trong blacklist; false nếu token vẫn hợp lệ
     */
    boolean isBlacklisted(String token);
}
