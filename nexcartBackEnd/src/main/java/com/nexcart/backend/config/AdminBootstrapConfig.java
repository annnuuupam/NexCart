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

    @Bean
    ApplicationRunner ensureAdminUser(UserRepository userRepository,
                                      @Value("${admin.bootstrap.username:admin}") String username,
                                      @Value("${admin.bootstrap.email:admin@nexcart.local}") String email,
                                      @Value("${admin.bootstrap.password:Admin@123}") String password) {
        return args -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            User admin = userRepository.findFirstByUsername(username).orElse(null);

            if (admin == null) {
                admin = new User();
                admin.setUsername(username);
                admin.setCreatedAt(LocalDateTime.now());
                logger.info("Bootstrap admin account created: username={} email={}", username, email);
            }

            admin.setEmail(email);
            admin.setPassword(encoder.encode(password));
            admin.setRole(Role.ADMIN);
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
        };
    }
}
