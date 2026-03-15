package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminSupportService;
import com.nexcart.backend.admin.service.AdminResetLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/support")
public class AdminSupportController {

    private final AdminSupportService adminSupportService;
    private final AdminResetLogService adminResetLogService;

    public AdminSupportController(AdminSupportService adminSupportService, AdminResetLogService adminResetLogService) {
        this.adminSupportService = adminSupportService;
        this.adminResetLogService = adminResetLogService;
    }

    @GetMapping("/tickets")
    public ResponseEntity<?> getTickets(@RequestParam(required = false) String status,
                                        @RequestParam(required = false) String q) {
        try {
            return ResponseEntity.ok(adminSupportService.getTickets(status, q));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to load support tickets"));
        }
    }

    @GetMapping("/tickets/{ticketNumber}")
    public ResponseEntity<?> getTicket(@PathVariable String ticketNumber) {
        try {
            return ResponseEntity.ok(adminSupportService.getTicketByNumber(ticketNumber));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to load support ticket"));
        }
    }

    @PutMapping("/tickets/{ticketNumber}")
    public ResponseEntity<?> updateTicket(@PathVariable String ticketNumber,
                                          @RequestBody(required = false) Map<String, Object> body) {
        try {
            return ResponseEntity.ok(adminSupportService.updateTicket(ticketNumber, body));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update support ticket"));
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {
        try {
            return ResponseEntity.ok(adminSupportService.getOverview());
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to load support overview"));
        }
    }

    @GetMapping("/reset-logs")
    public ResponseEntity<?> getResetLogs(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) String action,
                                          @RequestParam(required = false) String from,
                                          @RequestParam(required = false) String to) {
        try {
            LocalDateTime fromDt = parseDateStart(from);
            LocalDateTime toDt = parseDateEnd(to);
            return ResponseEntity.ok(adminResetLogService.getLogs(q, action, fromDt, toDt));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to load reset logs"));
        }
    }

    @GetMapping("/reset-logs/export")
    public ResponseEntity<?> exportResetLogs(@RequestParam(required = false) String q,
                                             @RequestParam(required = false) String action,
                                             @RequestParam(required = false) String from,
                                             @RequestParam(required = false) String to) {
        try {
            LocalDateTime fromDt = parseDateStart(from);
            LocalDateTime toDt = parseDateEnd(to);
            List<com.nexcart.backend.entity.PasswordResetAudit> logs = adminResetLogService.getLogs(q, action, fromDt, toDt);
            String csv = adminResetLogService.toCsv(logs);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reset-logs.csv")
                    .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                    .body(csv);
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to export reset logs"));
        }
    }

    private LocalDateTime parseDateStart(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value).atStartOfDay();
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private LocalDateTime parseDateEnd(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value).atTime(23, 59, 59);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}
