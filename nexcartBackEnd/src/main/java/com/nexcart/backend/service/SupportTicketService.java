package com.nexcart.backend.service;

import com.nexcart.backend.entity.SupportTicket;
import com.nexcart.backend.entity.SupportTicketPriority;
import com.nexcart.backend.entity.SupportTicketStatus;
import com.nexcart.backend.entity.SupportTicketType;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;

    public SupportTicketService(SupportTicketRepository supportTicketRepository) {
        this.supportTicketRepository = supportTicketRepository;
    }

    public Map<String, Object> createTicket(User user, Map<String, Object> body) {
        String subject = safe(body.get("subject"));
        String message = safe(body.get("message"));

        if (subject.length() < 5) {
            throw new IllegalArgumentException("Subject must be at least 5 characters");
        }
        if (message.length() < 8) {
            throw new IllegalArgumentException("Message must be at least 8 characters");
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber(generateTicketNumber());
        ticket.setUserId(user.getUserId());
        ticket.setUsername(user.getUsername());
        ticket.setEmail(user.getEmail());
        ticket.setPhone(safeOrNull(body.get("phone"), user.getPhone()));
        ticket.setOrderId(safeOrNull(body.get("orderId"), null));
        ticket.setType(parseType(body.get("type")));
        ticket.setPriority(parsePriority(body.get("priority")));
        ticket.setStatus(SupportTicketStatus.OPEN);
        ticket.setSubject(subject);
        ticket.setMessage(message);

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toTicketDto(saved);
    }

    public List<Map<String, Object>> getMyTickets(User user) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::toTicketDto)
                .toList();
    }

    public Map<String, Object> getMyTicketByNumber(User user, String ticketNumber) {
        SupportTicket ticket = supportTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (!ticket.getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("Ticket not found");
        }

        return toTicketDto(ticket);
    }

    private SupportTicketType parseType(Object value) {
        String raw = safe(value);
        if (raw.isBlank()) return SupportTicketType.OTHER;
        try {
            return SupportTicketType.valueOf(raw.trim().toUpperCase());
        } catch (Exception ignored) {
            return SupportTicketType.OTHER;
        }
    }

    private SupportTicketPriority parsePriority(Object value) {
        String raw = safe(value);
        if (raw.isBlank()) return SupportTicketPriority.MEDIUM;
        try {
            return SupportTicketPriority.valueOf(raw.trim().toUpperCase());
        } catch (Exception ignored) {
            return SupportTicketPriority.MEDIUM;
        }
    }

    private String safe(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String safeOrNull(Object incoming, String fallback) {
        String value = safe(incoming);
        if (!value.isBlank()) return value;
        if (fallback != null && !fallback.isBlank()) return fallback;
        return null;
    }

    private String generateTicketNumber() {
        return "SUP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private Map<String, Object> toTicketDto(SupportTicket ticket) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", ticket.getId());
        dto.put("ticketNumber", ticket.getTicketNumber());
        dto.put("userId", ticket.getUserId());
        dto.put("username", ticket.getUsername());
        dto.put("email", ticket.getEmail());
        dto.put("phone", ticket.getPhone());
        dto.put("orderId", ticket.getOrderId());
        dto.put("type", String.valueOf(ticket.getType()));
        dto.put("priority", String.valueOf(ticket.getPriority()));
        dto.put("status", String.valueOf(ticket.getStatus()));
        dto.put("subject", ticket.getSubject());
        dto.put("message", ticket.getMessage());
        dto.put("adminNote", ticket.getAdminNote());
        dto.put("createdAt", ticket.getCreatedAt());
        dto.put("updatedAt", ticket.getUpdatedAt());
        dto.put("resolvedAt", ticket.getResolvedAt());
        return dto;
    }
}
