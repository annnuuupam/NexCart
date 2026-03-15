package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminOrderService;
import com.nexcart.backend.admin.service.AdminUserService;
import com.nexcart.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/users")
public class AdminUsersController {

    private final AdminUserService adminUserService;
    private final AdminOrderService adminOrderService;

    public AdminUsersController(AdminUserService adminUserService, AdminOrderService adminOrderService) {
        this.adminUserService = adminUserService;
        this.adminOrderService = adminOrderService;
    }

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size) {
        try {
            Boolean blocked = null;
            if (status != null && !status.isBlank()) {
                String normalized = status.trim().toUpperCase();
                if ("ACTIVE".equals(normalized)) blocked = false;
                if ("BLOCKED".equals(normalized)) blocked = true;
            }

            if (size == null || size <= 0) {
                List<Map<String, Object>> users = adminUserService.searchUsers(query, blocked, Pageable.unpaged()).stream()
                        .map(adminUserService::buildUserSummary)
                        .collect(Collectors.toList());
                return ResponseEntity.ok(users);
            }

            int safePage = page == null || page < 1 ? 1 : page;
            Pageable pageable = PageRequest.of(safePage - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<User> paged = adminUserService.searchUsers(query, blocked, pageable);

            List<Map<String, Object>> users = paged.getContent().stream()
                    .map(adminUserService::buildUserSummary)
                    .collect(Collectors.toList());

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", safePage);
            pagination.put("size", size);
            pagination.put("totalPages", paged.getTotalPages());
            pagination.put("totalItems", paged.getTotalElements());

            Map<String, Object> response = new HashMap<>();
            response.put("data", users);
            response.put("pagination", pagination);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load users");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable("id") Integer id) {
        try {
            User user = adminUserService.getUserById(id);
            return ResponseEntity.ok(adminUserService.buildUserSummary(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load user");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") Integer id) {
        try {
            adminUserService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete user");
        }
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable("id") Integer id) {
        try {
            User updatedUser = adminUserService.setUserBlocked(id, true);
            return ResponseEntity.ok(adminUserService.buildUserSummary(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to block user");
        }
    }

    @PutMapping("/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable("id") Integer id) {
        try {
            User updatedUser = adminUserService.setUserBlocked(id, false);
            return ResponseEntity.ok(adminUserService.buildUserSummary(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to unblock user");
        }
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<?> getUserOrders(@PathVariable("id") Integer id) {
        try {
            return ResponseEntity.ok(adminOrderService.getOrdersByUserId(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load order history");
        }
    }
}
