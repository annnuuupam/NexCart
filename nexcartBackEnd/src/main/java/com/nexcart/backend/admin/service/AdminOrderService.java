package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.OrderStatus;
import com.nexcart.backend.entity.PaymentStatus;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.RefundStatus;
import com.nexcart.backend.entity.ReturnRequest;
import com.nexcart.backend.entity.ReturnRequestStatus;
import com.nexcart.backend.entity.SupportTicketStatus;
import com.nexcart.backend.entity.SupportTicketType;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.repository.ReturnRequestRepository;
import com.nexcart.backend.repository.SupportTicketRepository;
import com.nexcart.backend.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final NotificationService notificationService;

    public AdminOrderService(OrderRepository orderRepository,
                             OrderItemRepository orderItemRepository,
                             ProductRepository productRepository,
                             ReturnRequestRepository returnRequestRepository,
                             SupportTicketRepository supportTicketRepository,
                             NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.notificationService = notificationService;
    }

    public List<Map<String, Object>> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Order order : orders) result.add(toOrderRow(order));
        return result;
    }

    public List<Map<String, Object>> getOrdersByUserId(Integer userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Order order : orders) result.add(toOrderRow(order));
        return result;
    }

    public Order updateOrderStatus(String orderId, String status, String trackingNumber) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("Order not found"));

        try {
            order.setOrderStatus(OrderStatus.valueOf(status.trim().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status. Use PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURN_APPROVED, REFUNDED, FAILED");
        }

        if (trackingNumber != null && !trackingNumber.trim().isBlank()) {
            order.setTrackingNumber(trackingNumber.trim());
        }

        Order saved = orderRepository.save(order);
        notificationService.createAdminNotification(
                "Order " + saved.getOrderId() + " status updated",
                "Order status changed to " + saved.getOrderStatus().name(),
                "ORDER",
                "/admindashboard/orders"
        );
        notificationService.createUserNotification(
                saved.getUserId(),
                "Order " + saved.getOrderId() + " updated",
                "Your order status is now " + saved.getOrderStatus().name() + ".",
                "ORDER",
                "/orders"
        );
        return saved;
    }

    @Transactional
    public Map<String, Object> updateReturnStatus(String orderId, Integer productId, String statusRaw, String adminNote,
                                                  BigDecimal refundAmount, String refundReference) {
        if (productId == null) {
            throw new IllegalArgumentException("Product is required for return updates");
        }

        ReturnRequest request = returnRequestRepository.findByOrderIdAndProductId(orderId, productId)
                .orElseThrow(() -> new IllegalArgumentException("No return request found for this order item"));

        ReturnRequestStatus nextStatus;
        try {
            nextStatus = ReturnRequestStatus.valueOf(String.valueOf(statusRaw).trim().toUpperCase());
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid return status. Use REQUESTED, APPROVED, REJECTED, REFUNDED");
        }

        request.setStatus(nextStatus);
        if (nextStatus == ReturnRequestStatus.APPROVED) {
            request.setApprovedAt(LocalDateTime.now());
        }
        if (nextStatus == ReturnRequestStatus.REFUNDED) {
            request.setRefundStatus(RefundStatus.PROCESSED);
            if (refundAmount != null) {
                request.setRefundAmount(refundAmount);
            }
            if (refundReference != null && !refundReference.trim().isBlank()) {
                request.setRefundReference(refundReference.trim());
            }
        }
        ReturnRequest saved = returnRequestRepository.save(request);

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            if (nextStatus == ReturnRequestStatus.REQUESTED) {
                order.setOrderStatus(OrderStatus.RETURN_REQUESTED);
            } else if (nextStatus == ReturnRequestStatus.APPROVED) {
                order.setOrderStatus(OrderStatus.RETURN_APPROVED);
            } else if (nextStatus == ReturnRequestStatus.REFUNDED) {
                order.setOrderStatus(OrderStatus.REFUNDED);
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            } else if (nextStatus == ReturnRequestStatus.REJECTED) {
                order.setOrderStatus(OrderStatus.DELIVERED);
            }
            orderRepository.save(order);
        }

        supportTicketRepository
                .findFirstByOrderIdAndTypeOrderByCreatedAtDesc(orderId, SupportTicketType.RETURN_REFUND)
                .ifPresent(ticket -> {
                    if (nextStatus == ReturnRequestStatus.REQUESTED) {
                        ticket.setStatus(SupportTicketStatus.OPEN);
                    } else if (nextStatus == ReturnRequestStatus.APPROVED) {
                        ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
                    } else {
                        ticket.setStatus(SupportTicketStatus.RESOLVED);
                        ticket.setResolvedAt(LocalDateTime.now());
                    }

                    if (adminNote != null && !adminNote.trim().isBlank()) {
                        ticket.setAdminNote(adminNote.trim());
                    }

                    supportTicketRepository.save(ticket);
                });
        notificationService.createAdminNotification(
                "Return update for order " + orderId,
                "Return status updated to " + nextStatus.name(),
                "RETURN",
                "/admindashboard/orders"
        );
        if (order != null) {
            notificationService.createUserNotification(
                    order.getUserId(),
                    "Return update for order " + orderId,
                    "Your return status is now " + nextStatus.name() + ".",
                    "RETURN",
                    "/orders"
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("productId", productId);
        response.put("returnStatus", String.valueOf(saved.getStatus()));
        response.put("returnReason", saved.getReason());
        response.put("returnType", saved.getRequestType() == null ? "RETURN" : String.valueOf(saved.getRequestType()));
        response.put("refundStatus", saved.getRefundStatus() == null ? "" : String.valueOf(saved.getRefundStatus()));
        response.put("refundAmount", saved.getRefundAmount());
        response.put("refundReference", saved.getRefundReference());
        response.put("updatedAt", saved.getUpdatedAt());
        return response;
    }

    private Map<String, Object> toOrderRow(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getOrderId());
        List<String> productNames = new ArrayList<>();
        List<Map<String, Object>> lineItems = new ArrayList<>();

        List<ReturnRequest> returnRequests = returnRequestRepository.findAllByOrderId(order.getOrderId());
        Map<Integer, ReturnRequest> returnByProduct = new HashMap<>();
        for (ReturnRequest request : returnRequests) {
            if (request.getProductId() != null) {
                returnByProduct.put(request.getProductId(), request);
            }
        }

        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            String productName = product != null ? product.getName() : ("Product #" + item.getProductId());
            productNames.add(productName + " x" + item.getQuantity());

            ReturnRequest returnRequest = returnByProduct.get(item.getProductId());

            Map<String, Object> line = new HashMap<>();
            line.put("productId", item.getProductId());
            line.put("productName", productName);
            line.put("quantity", item.getQuantity());
            line.put("pricePerUnit", item.getPricePerUnit());
            line.put("totalPrice", item.getTotalPrice());
            line.put("returnStatus", returnRequest == null ? "" : String.valueOf(returnRequest.getStatus()));
            line.put("returnType", returnRequest == null ? "" : (returnRequest.getRequestType() == null ? "RETURN" : String.valueOf(returnRequest.getRequestType())));
            line.put("refundStatus", returnRequest == null ? "" : String.valueOf(returnRequest.getRefundStatus()));
            line.put("refundAmount", returnRequest == null ? null : returnRequest.getRefundAmount());
            line.put("refundReference", returnRequest == null ? null : returnRequest.getRefundReference());
            lineItems.add(line);
        }

        Map<String, Object> row = new HashMap<>();
        row.put("orderId", order.getOrderId());
        row.put("userId", order.getUserId());
        row.put("products", productNames);
        row.put("items", lineItems);
        row.put("totalAmount", order.getTotalAmount());
        row.put("orderStatus", order.getOrderStatus().name());
        row.put("paymentStatus", order.getPaymentStatus().name());
        row.put("trackingNumber", order.getTrackingNumber());
        row.put("couponCode", order.getCouponCode());
        row.put("discountAmount", order.getDiscountAmount());
        row.put("shippingAddress", order.getShippingAddress());
        row.put("createdAt", order.getCreatedAt());
        row.put("updatedAt", order.getUpdatedAt());
        row.put("returnRequests", returnRequests);
        return row;
    }
}
