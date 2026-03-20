package com.nexcart.backend.service;

import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.OrderStatus;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.ProductImage;
import com.nexcart.backend.entity.ReturnRequest;
import com.nexcart.backend.entity.ReturnRequestStatus;
import com.nexcart.backend.entity.ReturnRequestType;
import com.nexcart.backend.entity.SupportTicket;
import com.nexcart.backend.entity.SupportTicketPriority;
import com.nexcart.backend.entity.SupportTicketStatus;
import com.nexcart.backend.entity.SupportTicketType;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.ProductImageRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.repository.ReturnRequestRepository;
import com.nexcart.backend.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final OrderRepository orderRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final NotificationService notificationService;

    public OrderService(OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        ProductImageRepository productImageRepository,
                        OrderRepository orderRepository,
                        ReturnRequestRepository returnRequestRepository,
                        SupportTicketRepository supportTicketRepository,
                        NotificationService notificationService) {
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.orderRepository = orderRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrdersForUser(User user) {
        List<OrderItem> orderItems = orderItemRepository.findSuccessfulOrderItemsByUserId(user.getUserId());
        List<ReturnRequest> returnRequests = returnRequestRepository.findByUserId(user.getUserId());

        Map<String, ReturnRequest> returnByOrderProduct = new HashMap<>();
        for (ReturnRequest request : returnRequests) {
            String key = buildReturnKey(request.getOrderId(), request.getProductId());
            returnByOrderProduct.put(key, request);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        List<Map<String, Object>> products = new ArrayList<>();
        for (OrderItem item : orderItems) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product == null) continue;

            Order order = item.getOrder();
            List<ProductImage> images = productImageRepository.findByProduct_ProductId(product.getProductId());
            String imageUrl = images.isEmpty() ? null : images.get(0).getImageUrl();

            ReturnRequest returnRequest = returnByOrderProduct.get(buildReturnKey(order.getOrderId(), product.getProductId()));

            Map<String, Object> productDetails = new HashMap<>();
            productDetails.put("order_id", order.getOrderId());
            productDetails.put("order_status", String.valueOf(order.getOrderStatus()));
            productDetails.put("status", String.valueOf(order.getOrderStatus()));
            productDetails.put("payment_status", String.valueOf(order.getPaymentStatus()));
            productDetails.put("tracking_number", order.getTrackingNumber());
            productDetails.put("created_at", order.getCreatedAt());
            productDetails.put("updated_at", order.getUpdatedAt());
            productDetails.put("quantity", item.getQuantity());
            productDetails.put("total_price", item.getTotalPrice());
            productDetails.put("image_url", imageUrl);
            productDetails.put("product_id", product.getProductId());
            productDetails.put("name", product.getName());
            productDetails.put("description", product.getDescription());
            productDetails.put("price_per_unit", item.getPricePerUnit());
            productDetails.put("coupon_code", order.getCouponCode());
            productDetails.put("discount_amount", order.getDiscountAmount());
            productDetails.put("shipping_address", order.getShippingAddress());
            productDetails.put("subtotal_amount", order.getSubtotalAmount());
            productDetails.put("shipping_amount", order.getShippingAmount());
            productDetails.put("tax_amount", order.getTaxAmount());
            productDetails.put("total_amount", order.getTotalAmount());
            productDetails.put("payment_method", order.getPaymentMethod());
            productDetails.put("return_status", returnRequest == null ? "" : String.valueOf(returnRequest.getStatus()));
            productDetails.put("return_type", returnRequest == null ? "" : String.valueOf(returnRequest.getRequestType()));
            productDetails.put("refund_status", returnRequest == null ? "" : String.valueOf(returnRequest.getRefundStatus()));
            productDetails.put("refund_amount", returnRequest == null ? null : returnRequest.getRefundAmount());
            productDetails.put("refund_reference", returnRequest == null ? null : returnRequest.getRefundReference());

            products.add(productDetails);
        }

        response.put("products", products);
        return response;
    }

    public Map<String, Object> requestReturn(User user, String orderId, Integer productId, String reason, String requestTypeRaw) {
        if (productId == null) {
            throw new IllegalArgumentException("Product is required for return request");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getUserId() != user.getUserId()) {
            throw new IllegalArgumentException("You cannot request return for this order");
        }

        if (!isDelivered(order.getOrderStatus())) {
            throw new IllegalArgumentException("Return/Refund can be requested only for delivered orders");
        }

        boolean itemExists = orderItemRepository.findByOrderId(orderId).stream()
                .anyMatch(item -> item.getProductId() == productId.intValue());
        if (!itemExists) {
            throw new IllegalArgumentException("Product not found in this order");
        }

        ReturnRequestType requestType;
        try {
            requestType = ReturnRequestType.valueOf(String.valueOf(requestTypeRaw).trim().toUpperCase());
        } catch (Exception ex) {
            requestType = ReturnRequestType.RETURN;
        }

        ReturnRequest existing = returnRequestRepository
                .findByUserIdAndOrderIdAndProductId(user.getUserId(), orderId, productId)
                .orElse(null);
        if (existing != null) {
            ensureReturnSupportTicket(user, orderId, existing.getReason(), existing.getRequestType() == null ? ReturnRequestType.RETURN : existing.getRequestType());
            return Map.of(
                    "message", "Return request already exists",
                    "orderId", orderId,
                    "productId", productId,
                    "returnStatus", String.valueOf(existing.getStatus()),
                    "requestType", String.valueOf(existing.getRequestType() == null ? ReturnRequestType.RETURN : existing.getRequestType())
            );
        }

        String finalReason = (reason == null || reason.isBlank())
                ? "Customer requested " + requestType.name().toLowerCase()
                : reason.trim();

        ReturnRequest request = new ReturnRequest();
        request.setUserId(user.getUserId());
        request.setOrderId(orderId);
        request.setProductId(productId);
        request.setReason(finalReason);
        request.setRequestType(requestType);
        request.setStatus(ReturnRequestStatus.REQUESTED);
        returnRequestRepository.save(request);

        order.setOrderStatus(OrderStatus.RETURN_REQUESTED);
        orderRepository.save(order);

        ensureReturnSupportTicket(user, orderId, finalReason, requestType);
        notificationService.createAdminNotification(
                "Return request for order " + orderId,
                "A return/refund request has been submitted by the customer.",
                "RETURN",
                "/admindashboard/orders"
        );
        notificationService.createUserNotification(
                user.getUserId(),
                "Return request submitted",
                "We received your return/refund request for order " + orderId + ".",
                "RETURN",
                "/orders"
        );

        return Map.of(
                "message", "Request submitted",
                "orderId", orderId,
                "productId", productId,
                "returnStatus", String.valueOf(request.getStatus()),
                "requestType", String.valueOf(request.getRequestType())
        );
    }

    private boolean isDelivered(OrderStatus status) {
        if (status == null) return false;
        return status == OrderStatus.DELIVERED || status == OrderStatus.SUCCESS;
    }

    private void ensureReturnSupportTicket(User user, String orderId, String reason, ReturnRequestType requestType) {
        boolean exists = supportTicketRepository
                .findFirstByUserIdAndOrderIdAndType(user.getUserId(), orderId, SupportTicketType.RETURN_REFUND)
                .isPresent();

        if (exists) {
            return;
        }

        String typeLabel = requestType == ReturnRequestType.REFUND ? "Refund" : "Return";

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNumber(generateTicketNumber());
        ticket.setUserId(user.getUserId());
        ticket.setUsername(user.getUsername());
        ticket.setEmail(user.getEmail());
        ticket.setPhone(user.getPhone());
        ticket.setOrderId(orderId);
        ticket.setType(SupportTicketType.RETURN_REFUND);
        ticket.setPriority(SupportTicketPriority.HIGH);
        ticket.setStatus(SupportTicketStatus.OPEN);
        ticket.setSubject(typeLabel + " request for order " + orderId);
        ticket.setMessage((reason == null || reason.isBlank()) ? "Customer requested " + typeLabel.toLowerCase() : reason.trim());
        supportTicketRepository.save(ticket);
    }

    private String generateTicketNumber() {
        return "SUP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String buildReturnKey(String orderId, Integer productId) {
        return orderId + "::" + String.valueOf(productId);
    }
}





