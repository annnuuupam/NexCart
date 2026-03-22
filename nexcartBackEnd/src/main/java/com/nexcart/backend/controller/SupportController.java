package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.ProductImage;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.ProductImageRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.service.SupportTicketService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final SupportTicketService supportTicketService;

    public SupportController(OrderRepository orderRepository,
                             OrderItemRepository orderItemRepository,
                             ProductRepository productRepository,
                             ProductImageRepository productImageRepository,
                             SupportTicketService supportTicketService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.supportTicketService = supportTicketService;
    }

    @GetMapping("/help-center")
    public ResponseEntity<Map<String, Object>> getHelpCenter() {
        Map<String, Object> response = new HashMap<>();
        response.put("topics", List.of(
                Map.of(
                        "title", "Orders & Tracking",
                        "items", List.of(
                                "Track your order in real-time from the Orders section.",
                                "If order status is not updated, wait up to 24 hours before escalation.",
                                "For split shipments, each package gets a separate tracking timeline."
                        )
                ),
                Map.of(
                        "title", "Payments & Refunds",
                        "items", List.of(
                                "Refunds are initiated after successful quality checks at pickup.",
                                "UPI refunds typically complete within 24-48 hours.",
                                "Card or net banking refunds may take 3-5 business days."
                        )
                ),
                Map.of(
                        "title", "Account & Security",
                        "items", List.of(
                                "Keep your phone and email updated for secure verification.",
                                "Never share OTP, card PIN, or banking credentials.",
                                "Use strong passwords and rotate them periodically."
                        )
                )
        ));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/returns-policy")
    public ResponseEntity<Map<String, Object>> getReturnsPolicy() {
        Map<String, Object> response = new HashMap<>();
        response.put("window", "7-day easy returns on eligible products");
        response.put("steps", List.of(
                "Open Orders and select the item you want to return.",
                "Choose return reason and pickup slot.",
                "Keep product with original packaging and accessories.",
                "Refund is initiated after pickup quality check."
        ));
        response.put("notes", List.of(
                "Personal care and certain consumables may be non-returnable.",
                "Items damaged due to misuse are not eligible.",
                "Refund timelines depend on payment method and banking partner."
        ));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/contact")
    public ResponseEntity<Map<String, Object>> getContact() {
        Map<String, Object> response = new HashMap<>();
        response.put("email", "support@nexcart.com");
        response.put("phone", "+91 9988776655");
        response.put("hours", "Mon-Sun, 8:00 AM - 10:00 PM IST");
        response.put("channels", List.of("Chat Support", "Phone", "Email", "Callback Request"));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/tickets")
    public ResponseEntity<?> createTicket(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            return ResponseEntity.ok(supportTicketService.createTicket(authenticatedUser, body));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(500).body(Map.of("error", "Unable to create support ticket"));
        }
    }

    @GetMapping("/tickets/my")
    public ResponseEntity<?> getMyTickets(HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            return ResponseEntity.ok(supportTicketService.getMyTickets(authenticatedUser));
        } catch (Exception exception) {
            return ResponseEntity.status(500).body(Map.of("error", "Unable to load support tickets"));
        }
    }

    @GetMapping("/tickets/my/{ticketNumber}")
    public ResponseEntity<?> getMyTicket(@PathVariable String ticketNumber, HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }
            return ResponseEntity.ok(supportTicketService.getMyTicketByNumber(authenticatedUser, ticketNumber));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(404).body(Map.of("error", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(500).body(Map.of("error", "Unable to load support ticket"));
        }
    }

    @GetMapping("/track-order/{orderId}")
    public ResponseEntity<?> trackOrder(@PathVariable String orderId, HttpServletRequest request) {
        User authenticatedUser = (User) request.getAttribute("authenticatedUser");
        if (authenticatedUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getUserId() != authenticatedUser.getUserId()) {
            return ResponseEntity.status(404).body(Map.of("error", "Order not found"));
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        List<Map<String, Object>> products = new ArrayList<>();

        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product == null) continue;

            List<ProductImage> images = productImageRepository.findByProduct_ProductId(product.getProductId());
            String imageUrl = images.isEmpty() ? null : images.get(0).getImageUrl();

            Map<String, Object> row = new HashMap<>();
            row.put("productId", product.getProductId());
            row.put("name", product.getName());
            row.put("quantity", item.getQuantity());
            row.put("pricePerUnit", item.getPricePerUnit());
            row.put("totalPrice", item.getTotalPrice());
            row.put("imageUrl", imageUrl);
            products.add(row);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", order.getOrderId());
        response.put("status", String.valueOf(order.getStatus()));
        response.put("totalAmount", order.getTotalAmount());
        response.put("discountAmount", order.getDiscountAmount());
        response.put("couponCode", order.getCouponCode());
        response.put("shippingAddress", order.getShippingAddress());
        response.put("createdAt", order.getCreatedAt());
        response.put("updatedAt", order.getUpdatedAt());
        response.put("estimatedDelivery", "2-4 days from order date");
        response.put("products", products);

        return ResponseEntity.ok(response);
    }
}
