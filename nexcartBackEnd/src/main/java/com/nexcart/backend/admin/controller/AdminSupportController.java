package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminSupportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/support")
public class AdminSupportController {

    private final AdminSupportService adminSupportService;

    public AdminSupportController(AdminSupportService adminSupportService) {
        this.adminSupportService = adminSupportService;
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
}
