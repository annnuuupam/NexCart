package com.nexcart.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nexcart.backend.entity.PasswordResetAudit;

public interface PasswordResetAuditRepository extends JpaRepository<PasswordResetAudit, Integer> {
}
