package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.request.LoginRequest;
import com.techvanguard.taskmanager.dto.request.RegisterRequest;
import com.techvanguard.taskmanager.dto.response.AuthResponse;
import com.techvanguard.taskmanager.dto.response.UserProfileResponse;

/**
 * Giao diện dịch vụ xử lý nghiệp vụ xác thực người dùng.
 * Tách biệt interface và implement theo đúng quy chuẩn kiến trúc của dự án.
 */
public interface AuthService {

    /**
     * Xử lý đăng ký tài khoản mới cho người dùng.
     *
     * @param request DTO chứa thông tin email, mật khẩu và họ tên
     * @return UserProfileResponse Thông tin tài khoản vừa tạo
     */
    UserProfileResponse register(RegisterRequest request);

    /**
     * Xử lý xác thực tài khoản và cấp phát JWT token.
     *
     * @param request DTO chứa email và mật khẩu
     * @return AuthResponse Chứa Access Token và thông tin user
     */
    AuthResponse login(LoginRequest request);

    /**
     * Xử lý đăng xuất tài khoản và đưa token hiện tại vào Redis Blacklist.
     *
     * @param token Chuỗi JWT Token của phiên làm việc hiện tại
     */
    void logout(String token);

    /**
     * Lấy thông tin hồ sơ của người dùng đang đăng nhập dựa trên ID định danh.
     *
     * @param currentUserId ID người dùng lấy từ SecurityContext
     * @return UserProfileResponse Hồ sơ chi tiết của người dùng
     */
    UserProfileResponse getCurrentUser(Long currentUserId);
}
