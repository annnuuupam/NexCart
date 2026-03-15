package com.nexcart.backend.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.nexcart.backend.repository.PasswordResetTokenRepository;

@Component
public class PasswordResetCleanupScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetCleanupScheduler.class);
    private final PasswordResetTokenRepository repository;

    public PasswordResetCleanupScheduler(PasswordResetTokenRepository repository) {
        this.repository = repository;
    }

    @Scheduled(fixedRateString = "${app.reset.cleanup-ms:3600000}")
    @Transactional
    public void cleanupExpiredTokens() {
        repository.deleteByExpiresAtBefore(LocalDateTime.now());
        logger.debug("Expired password reset tokens cleaned up.");
    }
}
