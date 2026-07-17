package com.nexcart.backend.config;

import com.nexcart.backend.entity.Role;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class AdminBootstrapConfig {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapConfig.class);

    /**
     * Seeds both the admin account and the demo customer account on every startup.
     * Uses an idempotent upsert pattern — safe to run multiple times.
     * Passwords are stored using BCrypt — no authentication bypass.
     */
    @Bean
    ApplicationRunner ensureDemoUsers(UserRepository userRepository,
                                      @Value("${admin.bootstrap.username:admin}") String adminUsername,
                                      @Value("${admin.bootstrap.email:admin@nexcart.local}") String adminEmail,
                                      @Value("${admin.bootstrap.password:Admin@123}") String adminPassword,
                                      @Value("${demo.customer.username:demo_user}") String demoUsername,
                                      @Value("${demo.customer.email:demo_user@nexcart.local}") String demoEmail,
                                      @Value("${demo.customer.password:Demo@123}") String demoPassword) {
        return args -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

            // ── 1. Admin account ──────────────────────────────────────────────────
            User admin = userRepository.findFirstByUsername(adminUsername).orElse(null);
            if (admin == null) {
                admin = new User();
                admin.setUsername(adminUsername);
                admin.setCreatedAt(LocalDateTime.now());
                logger.info("Bootstrap: admin account created — username={} email={}", adminUsername, adminEmail);
            }
            admin.setEmail(adminEmail);
            admin.setPassword(encoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setBlocked(false);
            admin.setStatus("ACTIVE");
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);

            // ── 2. Demo customer account ──────────────────────────────────────────
            User demoUser = userRepository.findFirstByUsername(demoUsername).orElse(null);
            if (demoUser == null) {
                demoUser = new User();
                demoUser.setUsername(demoUsername);
                demoUser.setCreatedAt(LocalDateTime.now());
                logger.info("Bootstrap: demo customer account created — username={} email={}", demoUsername, demoEmail);
            }
            demoUser.setEmail(demoEmail);
            demoUser.setPassword(encoder.encode(demoPassword));
            demoUser.setRole(Role.CUSTOMER);
            demoUser.setBlocked(false);
            demoUser.setStatus("ACTIVE");
            demoUser.setUpdatedAt(LocalDateTime.now());
            userRepository.save(demoUser);

            logger.info("Bootstrap complete — admin='{}' demo_customer='{}'", adminUsername, demoUsername);
        };
    }
}
