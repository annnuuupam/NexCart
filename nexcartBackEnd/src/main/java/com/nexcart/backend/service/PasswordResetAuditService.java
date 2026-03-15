package com.nexcart.backend.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.nexcart.backend.entity.PasswordResetAudit;
import com.nexcart.backend.repository.PasswordResetAuditRepository;

@Service
public class PasswordResetAuditService {

    private final PasswordResetAuditRepository repository;

    public PasswordResetAuditService(PasswordResetAuditRepository repository) {
        this.repository = repository;
    }

    public void log(String action, Integer userId, String identifier, String ipAddress, String userAgent) {
        PasswordResetAudit audit = new PasswordResetAudit(
                action,
                userId,
                identifier,
                ipAddress,
                userAgent,
                LocalDateTime.now()
        );
        repository.save(audit);
    }
}
