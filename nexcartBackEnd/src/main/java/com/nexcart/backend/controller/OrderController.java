package com.nexcart.backend.controller;

import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getOrdersForUser(HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            Map<String, Object> response = orderService.getOrdersForUser(authenticatedUser);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(400).body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @PostMapping("/{orderId}/return-request")
    public ResponseEntity<?> requestReturn(@PathVariable String orderId,
                                           @RequestBody(required = false) Map<String, Object> body,
                                           HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            String reason = body == null ? null : String.valueOf(body.getOrDefault("reason", ""));
            String requestType = body == null ? null : String.valueOf(body.getOrDefault("requestType", "RETURN"));
            Integer productId = null;
            if (body != null && body.get("productId") != null) {
                productId = Integer.valueOf(String.valueOf(body.get("productId")));
            }

            return ResponseEntity.ok(orderService.requestReturn(authenticatedUser, orderId, productId, reason, requestType));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to submit return request"));
        }
    }
}
