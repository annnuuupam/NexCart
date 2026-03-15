package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminOrderService;
import com.nexcart.backend.entity.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/admin/orders")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        try {
            return ResponseEntity.ok(adminOrderService.getAllOrders());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load orders");
        }
    }

    @PutMapping("/status")
    public ResponseEntity<?> updateOrderStatus(@RequestBody Map<String, Object> request) {
        try {
            String orderId = String.valueOf(request.get("orderId"));
            String status = String.valueOf(request.get("status"));
            String trackingNumber = request.get("trackingNumber") == null ? null : String.valueOf(request.get("trackingNumber"));
            Order updated = adminOrderService.updateOrderStatus(orderId, status, trackingNumber);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("orderId", updated.getOrderId());
            response.put("status", updated.getOrderStatus() != null ? updated.getOrderStatus().name() : null);
            response.put("updatedAt", updated.getUpdatedAt());
            response.put("trackingNumber", updated.getTrackingNumber());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update order status");
        }
    }

    @PutMapping("/return-status")
    public ResponseEntity<?> updateReturnStatus(@RequestBody Map<String, Object> request) {
        try {
            String orderId = String.valueOf(request.get("orderId"));
            String status = String.valueOf(request.get("status"));
            Integer productId = request.get("productId") == null ? null : Integer.valueOf(String.valueOf(request.get("productId")));
            String adminNote = request.get("adminNote") == null ? "" : String.valueOf(request.get("adminNote"));
            BigDecimal refundAmount = null;
            if (request.get("refundAmount") != null && !String.valueOf(request.get("refundAmount")).isBlank()) {
                refundAmount = new BigDecimal(String.valueOf(request.get("refundAmount")));
            }
            String refundReference = request.get("refundReference") == null ? null : String.valueOf(request.get("refundReference"));

            return ResponseEntity.ok(adminOrderService.updateReturnStatus(orderId, productId, status, adminNote, refundAmount, refundReference));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update return status"));
        }
    }
}
