package com.nexcart.backend.admin.controller;

import com.nexcart.backend.entity.Notification;
import com.nexcart.backend.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/notifications")
public class AdminNotificationController {

    private final NotificationService notificationService;

    public AdminNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestParam(name = "q", defaultValue = "") String query,
                                              @RequestParam(name = "page", defaultValue = "1") int page,
                                              @RequestParam(name = "size", defaultValue = "10") int size,
                                              @RequestParam(name = "limit", defaultValue = "0") int limit) {
        try {
            long unreadCount = notificationService.getUnreadCount();
            Map<String, Object> response = new HashMap<>();
            List<Map<String, Object>> items;

            if (limit > 0) {
                items = notificationService.getLatest(limit).stream()
                        .map(notificationService::toDto)
                        .toList();
                response.put("page", 1);
                response.put("size", items.size());
                response.put("totalItems", items.size());
                response.put("totalPages", 1);
            } else {
                int safePage = Math.max(1, page);
                int safeSize = Math.max(1, Math.min(size, 50));
                Page<com.nexcart.backend.entity.Notification> pageResult = notificationService.search(query, safePage - 1, safeSize);
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
    public ResponseEntity<?> markAllRead() {
        try {
            notificationService.markAllRead();
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update notifications"));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        try {
            Notification notification = notificationService.markRead(id);
            return ResponseEntity.ok(notificationService.toDto(notification));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update notification"));
        }
    }
}
