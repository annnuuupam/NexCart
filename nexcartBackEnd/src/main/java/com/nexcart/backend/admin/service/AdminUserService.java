package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Role;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.JWTTokenRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminUserService {
    private final UserRepository userRepository;
    private final JWTTokenRepository jwtTokenRepository;
    private final OrderRepository orderRepository;

    public AdminUserService(UserRepository userRepository, JWTTokenRepository jwtTokenRepository, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.jwtTokenRepository = jwtTokenRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public User modifyUser(Integer userId, String username, String email, String role) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User existingUser = userOptional.get();

        if (username != null && !username.isEmpty()) {
            existingUser.setUsername(username);
        }
        if (email != null && !email.isEmpty()) {
            existingUser.setEmail(email);
        }
        if (role != null && !role.isEmpty()) {
            try {
                existingUser.setRole(Role.valueOf(role.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + role);
            }
        }

        existingUser.setUpdatedAt(LocalDateTime.now());
        jwtTokenRepository.deleteByUserId(userId);
        return userRepository.save(existingUser);
    }

    public User getUserById(Integer userId) {
        return userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> searchUsers(String query) {
        if (query == null || query.isBlank()) {
            return getAllUsers();
        }
        return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
                query,
                query,
                query
        );
    }

    public Page<User> searchUsers(String query, Boolean blocked, Pageable pageable) {
        Pageable safePageable = pageable == null ? Pageable.unpaged() : pageable;
        return userRepository.searchUsers(query, blocked, safePageable);
    }

    @Transactional
    public User setUserBlocked(Integer userId, Boolean blocked) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        boolean shouldBlock = Boolean.TRUE.equals(blocked);
        user.setBlocked(shouldBlock);
        user.setStatus(shouldBlock ? "BLOCKED" : "ACTIVE");
        user.setUpdatedAt(LocalDateTime.now());
        jwtTokenRepository.deleteByUserId(userId);
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        jwtTokenRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }

    public Map<String, Object> buildUserSummary(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getUserId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().name());
        response.put("blocked", user.getBlocked());
        response.put("status", user.getStatus());
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());
        response.put("lastLoginAt", user.getLastLoginAt());
        response.put("totalOrders", orderRepository.countByUserId(user.getUserId()));

        BigDecimal totalSpending = orderRepository.calculateUserSuccessfulSpend(user.getUserId());
        response.put("totalSpending", totalSpending == null ? BigDecimal.ZERO : totalSpending);
        return response;
    }
}
