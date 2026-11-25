package com.tanseng2027.task_management.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.tanseng2027.task_management.entity.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {

    boolean existsByTokenHash(String tokenHash);

    // Xóa các token đã hết hạn (token hết hạn thì tự nó đã không dùng được, không cần giữ trong blacklist)
    @Transactional
    @Modifying
    @Query("DELETE FROM RevokedToken r WHERE r.expiresAt < :now")
    int deleteExpired(@Param("now") LocalDateTime now);
}
