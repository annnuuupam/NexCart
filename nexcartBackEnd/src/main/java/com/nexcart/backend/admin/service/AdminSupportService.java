package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.SupportTicket;
import com.nexcart.backend.entity.SupportTicketStatus;
import com.nexcart.backend.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminSupportService {

    private final SupportTicketRepository supportTicketRepository;

    public AdminSupportService(SupportTicketRepository supportTicketRepository) {
        this.supportTicketRepository = supportTicketRepository;
    }

    public List<Map<String, Object>> getTickets(String status, String q) {
        SupportTicketStatus parsedStatus = parseStatus(status);
        return supportTicketRepository.searchTickets(parsedStatus, q)
                .stream()
                .map(this::toTicketDto)
                .toList();
    }

    public Map<String, Object> getTicketByNumber(String ticketNumber) {
        SupportTicket ticket = supportTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        return toTicketDto(ticket);
    }

    public Map<String, Object> updateTicket(String ticketNumber, Map<String, Object> body) {
        SupportTicket ticket = supportTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        String statusRaw = body == null ? "" : String.valueOf(body.getOrDefault("status", ""));
        if (!statusRaw.isBlank()) {
            try {
                SupportTicketStatus status = SupportTicketStatus.valueOf(statusRaw.trim().toUpperCase());
                ticket.setStatus(status);
                if (status == SupportTicketStatus.RESOLVED || status == SupportTicketStatus.CLOSED) {
                    ticket.setResolvedAt(LocalDateTime.now());
                }
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException("Invalid status. Use OPEN, IN_PROGRESS, RESOLVED, CLOSED");
            }
        }

        String note = body == null ? "" : String.valueOf(body.getOrDefault("adminNote", "")).trim();
        if (!note.isBlank()) {
            ticket.setAdminNote(note);
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toTicketDto(saved);
    }

    public Map<String, Object> getOverview() {
        long total = supportTicketRepository.count();
        long open = supportTicketRepository.countByStatus(SupportTicketStatus.OPEN);
        long inProgress = supportTicketRepository.countByStatus(SupportTicketStatus.IN_PROGRESS);
        long resolved = supportTicketRepository.countByStatus(SupportTicketStatus.RESOLVED);
        long closed = supportTicketRepository.countByStatus(SupportTicketStatus.CLOSED);

        Map<String, Object> response = new HashMap<>();
        response.put("total", total);
        response.put("open", open);
        response.put("inProgress", inProgress);
        response.put("resolved", resolved);
        response.put("closed", closed);
        return response;
    }

    private SupportTicketStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank() || "ALL".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return SupportTicketStatus.valueOf(raw.trim().toUpperCase());
        } catch (Exception exception) {
            return null;
        }
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
