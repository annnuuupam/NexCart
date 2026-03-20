package com.nexcart.backend.service;

import com.nexcart.backend.entity.Notification;
import com.nexcart.backend.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<Notification> getLatest(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return notificationRepository.findByAudienceOrderByCreatedAtDesc("ADMIN", PageRequest.of(0, safeLimit)).getContent();
    }

    public List<Notification> getLatestForUser(Integer userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return notificationRepository.findByAudienceAndUserIdOrderByCreatedAtDesc("USER", userId, PageRequest.of(0, safeLimit)).getContent();
    }

    public Page<Notification> search(String query, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        PageRequest pageable = PageRequest.of(safePage, safeSize);
        if (query == null || query.isBlank()) {
            return notificationRepository.findByAudienceOrderByCreatedAtDesc("ADMIN", pageable);
        }
        String q = query.trim();
        return notificationRepository.searchAdmin("ADMIN", q, pageable);
    }

    public Page<Notification> searchForUser(Integer userId, String query, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        PageRequest pageable = PageRequest.of(safePage, safeSize);
        if (query == null || query.isBlank()) {
            return notificationRepository.findByAudienceAndUserIdOrderByCreatedAtDesc("USER", userId, pageable);
        }
        String q = query.trim();
        return notificationRepository.searchUser("USER", userId, q, pageable);
    }

    public long getUnreadCount() {
        return notificationRepository.countByAudienceAndIsReadFalse("ADMIN");
    }

    public long getUnreadCountForUser(Integer userId) {
        return notificationRepository.countByAudienceAndUserIdAndIsReadFalse("USER", userId);
    }

    public void markAllRead() {
        List<Notification> unread = notificationRepository.findByAudienceOrderByCreatedAtDesc("ADMIN", PageRequest.of(0, 200)).getContent()
                .stream().filter(n -> !n.isRead()).toList();
        if (unread.isEmpty()) return;
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public Notification markRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!"ADMIN".equalsIgnoreCase(notification.getAudience())) {
            throw new IllegalArgumentException("Notification not found");
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return notification;
    }

    public void markAllReadForUser(Integer userId) {
        List<Notification> unread = notificationRepository.findByAudienceAndUserIdOrderByCreatedAtDesc("USER", userId, PageRequest.of(0, 200)).getContent()
                .stream().filter(n -> !n.isRead()).toList();
        if (unread.isEmpty()) return;
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public Notification markReadForUser(Integer userId, Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!"USER".equalsIgnoreCase(notification.getAudience()) || notification.getUserId() == null || !notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Notification not found");
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return notification;
    }

    public Notification createAdminNotification(String title, String message, String type, String link) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type == null ? "SYSTEM" : type.trim().toUpperCase());
        notification.setLink(link);
        notification.setAudience("ADMIN");
        notification.setUserId(null);
        Notification saved = notificationRepository.save(notification);
        try {
            messagingTemplate.convertAndSend("/topic/admin-notifications", toDto(saved));
        } catch (Exception ignored) {
        }
        return saved;
    }

    public Notification createUserNotification(Integer userId, String title, String message, String type, String link) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type == null ? "SYSTEM" : type.trim().toUpperCase());
        notification.setLink(link);
        notification.setAudience("USER");
        notification.setUserId(userId);
        Notification saved = notificationRepository.save(notification);
        try {
            messagingTemplate.convertAndSend("/topic/user-notifications/" + userId, toDto(saved));
        } catch (Exception ignored) {
        }
        return saved;
    }

    public boolean hasUnreadAdminNotification(String type, String link) {
        if (type == null || link == null) return false;
        return notificationRepository.existsByAudienceAndTypeAndLinkAndIsReadFalse("ADMIN", type.trim().toUpperCase(), link);
    }

    public boolean hasUnreadUserNotification(Integer userId, String type, String link) {
        if (userId == null || type == null || link == null) return false;
        return notificationRepository.existsByAudienceAndUserIdAndTypeAndLinkAndIsReadFalse("USER", userId, type.trim().toUpperCase(), link);
    }

    public Map<String, Object> toDto(Notification notification) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", notification.getId());
        dto.put("title", notification.getTitle());
        dto.put("message", notification.getMessage());
        dto.put("type", notification.getType());
        dto.put("audience", notification.getAudience());
        dto.put("userId", notification.getUserId());
        dto.put("link", notification.getLink());
        dto.put("read", notification.isRead());
        dto.put("createdAt", notification.getCreatedAt());
        return dto;
    }
}
