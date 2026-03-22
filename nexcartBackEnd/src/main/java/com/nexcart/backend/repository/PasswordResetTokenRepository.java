package com.nexcart.backend.repository;

import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nexcart.backend.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {
    Optional<PasswordResetToken> findFirstByToken(String token);
    void deleteByUser_UserId(Integer userId);
    void deleteByExpiresAtBefore(LocalDateTime time);
}
