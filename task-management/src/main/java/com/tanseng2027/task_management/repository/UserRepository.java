package com.tanseng2027.task_management.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tanseng2027.task_management.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    
    // Tìm user theo email (Dùng cho đăng nhập sau này)
    Optional<User> findByEmail(String email);
    
    // Kiểm tra email tồn tại (Dùng cho đăng ký)
    boolean existsByEmail(String email); 
}