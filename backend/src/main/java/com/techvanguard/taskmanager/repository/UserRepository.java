package com.techvanguard.taskmanager.repository;

import com.techvanguard.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Tầng truy xuất dữ liệu cho bảng users.
 * Sử dụng Spring Data JPA để tự động sinh các câu truy vấn an toàn (chống SQL Injection 100%).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm kiếm người dùng bằng địa chỉ email khi thực hiện đăng nhập.
     *
     * @param email Địa chỉ email cần tra cứu
     * @return Optional chứa User nếu tìm thấy, hoặc Optional.empty() nếu không có
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra nhanh sự tồn tại của email trong hệ thống trước khi cho phép đăng ký mới.
     * Phương thức này sinh câu lệnh SELECT COUNT(...) tối ưu hơn việc nạp cả Entity ra ngoài bộ nhớ.
     *
     * @param email Địa chỉ email cần kiểm tra trùng lặp
     * @return true nếu email đã có người sử dụng, ngược lại trả về false
     */
    boolean existsByEmail(String email);
}
