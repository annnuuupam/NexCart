package com.nexcart.backend.repository;

import com.nexcart.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByAudienceOrderByCreatedAtDesc(String audience, Pageable pageable);
    Page<Notification> findByAudienceAndUserIdOrderByCreatedAtDesc(String audience, Integer userId, Pageable pageable);
    @Query("SELECT n FROM Notification n WHERE n.audience = :audience AND (LOWER(n.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(n.message) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY n.createdAt DESC")
    Page<Notification> searchAdmin(String audience, String q, Pageable pageable);
    @Query("SELECT n FROM Notification n WHERE n.audience = :audience AND n.userId = :userId AND (LOWER(n.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(n.message) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY n.createdAt DESC")
    Page<Notification> searchUser(String audience, Integer userId, String q, Pageable pageable);
    long countByAudienceAndIsReadFalse(String audience);
    long countByAudienceAndUserIdAndIsReadFalse(String audience, Integer userId);
    boolean existsByAudienceAndTypeAndLinkAndIsReadFalse(String audience, String type, String link);
    boolean existsByAudienceAndUserIdAndTypeAndLinkAndIsReadFalse(String audience, Integer userId, String type, String link);
}
