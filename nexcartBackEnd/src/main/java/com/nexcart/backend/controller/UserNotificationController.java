package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Notification;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class UserNotificationController {

    private final NotificationService notificationService;

    public UserNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(HttpServletRequest request,
                                              @RequestParam(name = "q", defaultValue = "") String query,
                                              @RequestParam(name = "page", defaultValue = "1") int page,
                                              @RequestParam(name = "size", defaultValue = "10") int size,
                                              @RequestParam(name = "limit", defaultValue = "0") int limit) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user == null) return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));

            long unreadCount = notificationService.getUnreadCountForUser(user.getUserId());
            Map<String, Object> response = new HashMap<>();
            List<Map<String, Object>> items;

            if (limit > 0) {
                items = notificationService.getLatestForUser(user.getUserId(), limit).stream()
                        .map(notificationService::toDto)
                        .toList();
                response.put("page", 1);
                response.put("size", items.size());
                response.put("totalItems", items.size());
                response.put("totalPages", 1);
            } else {
                int safePage = Math.max(1, page);
                int safeSize = Math.max(1, Math.min(size, 50));
                Page<Notification> pageResult = notificationService.searchForUser(user.getUserId(), query, safePage - 1, safeSize);
                items = pageResult.getContent().stream()
                        .map(notificationService::toDto)
                        .toList();
                response.put("page", safePage);
                response.put("size", safeSize);
                response.put("totalItems", pageResult.getTotalElements());
                response.put("totalPages", pageResult.getTotalPages());
            }

            response.put("items", items);
            response.put("unreadCount", unreadCount);
            return ResponseEntity.ok(response);
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to load notifications"));
        }
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(HttpServletRequest request) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user == null) return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            notificationService.markAllReadForUser(user.getUserId());
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update notifications"));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(HttpServletRequest request, @PathVariable Long id) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user == null) return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            Notification notification = notificationService.markReadForUser(user.getUserId(), id);
            return ResponseEntity.ok(notificationService.toDto(notification));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update notification"));
        }
    }
}
