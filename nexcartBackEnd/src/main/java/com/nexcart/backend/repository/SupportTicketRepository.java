package com.nexcart.backend.repository;

import com.nexcart.backend.entity.SupportTicket;
import com.nexcart.backend.entity.SupportTicketStatus;
import com.nexcart.backend.entity.SupportTicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Optional<SupportTicket> findByTicketNumber(String ticketNumber);

    Optional<SupportTicket> findFirstByUserIdAndOrderIdAndType(Integer userId, String orderId, SupportTicketType type);

    Optional<SupportTicket> findFirstByOrderIdAndTypeOrderByCreatedAtDesc(String orderId, SupportTicketType type);

    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Integer userId);

    long countByStatus(SupportTicketStatus status);

    @Query("""
            SELECT t FROM SupportTicket t
            WHERE (:status IS NULL OR t.status = :status)
              AND (
                    :q IS NULL OR :q = '' OR
                    LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(t.username) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(t.email) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(COALESCE(t.phone, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(COALESCE(t.subject, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(COALESCE(t.orderId, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                  )
            ORDER BY t.createdAt DESC
            """)
    List<SupportTicket> searchTickets(@Param("status") SupportTicketStatus status, @Param("q") String q);
}