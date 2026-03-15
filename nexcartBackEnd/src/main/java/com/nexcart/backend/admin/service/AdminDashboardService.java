package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.OrderStatus;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.ProductImage;
import com.nexcart.backend.entity.ReturnRequest;
import com.nexcart.backend.entity.ReturnRequestStatus;
import com.nexcart.backend.entity.SupportTicketStatus;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.ProductImageRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.repository.ReturnRequestRepository;
import com.nexcart.backend.repository.SupportTicketRepository;
import com.nexcart.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final ReturnRequestRepository returnRequestRepository;

    public AdminDashboardService(ProductRepository productRepository,
                                 ProductImageRepository productImageRepository,
                                 UserRepository userRepository,
                                 OrderRepository orderRepository,
                                 OrderItemRepository orderItemRepository,
                                 SupportTicketRepository supportTicketRepository,
                                 ReturnRequestRepository returnRequestRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.returnRequestRepository = returnRequestRepository;
    }

    public Map<String, Object> getDashboardOverview(int days) {
        List<Product> products = productRepository.findAll();
        List<User> users = userRepository.findAll();
        List<Order> successfulOrders = orderRepository.findAll().stream()
                .filter(order -> isSuccessful(order.getOrderStatus()))
                .collect(Collectors.toList());

        Map<Integer, Integer> soldByProductId = new HashMap<>();
        Map<String, Integer> categorySales = new HashMap<>();
        Map<Integer, Integer> successfulOrdersByUserId = new HashMap<>();
        Map<Integer, BigDecimal> totalSpentByUserId = new HashMap<>();
        int totalSoldItems = 0;

        int trendDays = (days == 7 || days == 14 || days == 30) ? days : 14;
        LocalDate today = LocalDate.now();
        Map<LocalDate, BigDecimal> dailyRevenue = new LinkedHashMap<>();
        for (int i = trendDays - 1; i >= 0; i--) {
            dailyRevenue.put(today.minusDays(i), BigDecimal.ZERO);
        }

        for (Order order : successfulOrders) {
            successfulOrdersByUserId.put(order.getUserId(), successfulOrdersByUserId.getOrDefault(order.getUserId(), 0) + 1);
            totalSpentByUserId.put(order.getUserId(), totalSpentByUserId.getOrDefault(order.getUserId(), BigDecimal.ZERO).add(order.getTotalAmount()));

            LocalDate orderDay = order.getCreatedAt().toLocalDate();
            if (dailyRevenue.containsKey(orderDay)) {
                dailyRevenue.put(orderDay, dailyRevenue.get(orderDay).add(order.getTotalAmount()));
            }

            List<OrderItem> items = orderItemRepository.findByOrderId(order.getOrderId());
            for (OrderItem item : items) {
                soldByProductId.put(item.getProductId(), soldByProductId.getOrDefault(item.getProductId(), 0) + item.getQuantity());
                String categoryName = productRepository.findCategoryNameByProductId(item.getProductId());
                String safeCategory = categoryName == null ? "Uncategorized" : categoryName;
                categorySales.put(safeCategory, categorySales.getOrDefault(safeCategory, 0) + item.getQuantity());
                totalSoldItems += item.getQuantity();
            }
        }

        int totalRemainingItems = products.stream().mapToInt(p -> p.getStock() == null ? 0 : p.getStock()).sum();
        BigDecimal totalRevenue = orderRepository.calculateOverallBusiness();

        List<ReturnRequest> returnRequests = returnRequestRepository.findAll();
        long totalReturnRequests = returnRequests.size();
        long completedReturns = returnRequests.stream()
                .filter(req -> req.getStatus() == ReturnRequestStatus.APPROVED || req.getStatus() == ReturnRequestStatus.REFUNDED)
                .count();

        long supportOpen = supportTicketRepository.countByStatus(SupportTicketStatus.OPEN);
        long supportInProgress = supportTicketRepository.countByStatus(SupportTicketStatus.IN_PROGRESS);
        long supportResolved = supportTicketRepository.countByStatus(SupportTicketStatus.RESOLVED);
        long supportClosed = supportTicketRepository.countByStatus(SupportTicketStatus.CLOSED);

        List<Map<String, Object>> productRows = new ArrayList<>();
        for (Product product : products) {
            List<ProductImage> images = productImageRepository.findByProduct_ProductId(product.getProductId());
            int soldUnits = soldByProductId.getOrDefault(product.getProductId(), 0);

            Map<String, Object> row = new HashMap<>();
            row.put("productId", product.getProductId());
            row.put("name", product.getName());
            row.put("category", product.getCategory() != null ? product.getCategory().getCategoryName() : "-");
            row.put("categoryId", product.getCategory() != null ? product.getCategory().getCategoryId() : null);
            row.put("price", product.getPrice());
            row.put("remainingStock", product.getStock());
            row.put("soldUnits", soldUnits);
            row.put("imageUrl", images.isEmpty() ? null : images.get(0).getImageUrl());
            row.put("imageUrls", images.stream().map(ProductImage::getImageUrl).toList());
            productRows.add(row);
        }

        productRows.sort(Comparator.comparing(row -> ((Integer) row.get("soldUnits")), Comparator.reverseOrder()));

        List<Map<String, Object>> userRows = new ArrayList<>();
        for (User user : users) {
            Map<String, Object> row = new HashMap<>();
            row.put("userId", user.getUserId());
            row.put("username", user.getUsername());
            row.put("email", user.getEmail());
            row.put("role", user.getRole().name());
            row.put("phone", user.getPhone());
            row.put("status", user.getStatus());
            row.put("lastLoginAt", user.getLastLoginAt());
            row.put("blocked", user.getBlocked());
            row.put("successfulOrders", successfulOrdersByUserId.getOrDefault(user.getUserId(), 0));
            row.put("totalSpent", totalSpentByUserId.getOrDefault(user.getUserId(), BigDecimal.ZERO));
            row.put("createdAt", user.getCreatedAt());
            row.put("updatedAt", user.getUpdatedAt());
            userRows.add(row);
        }

        userRows.sort(Comparator.comparing(row -> ((BigDecimal) row.get("totalSpent")), Comparator.reverseOrder()));

        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd MMM");
        List<Map<String, Object>> dailyRevenueSeries = dailyRevenue.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> point = new LinkedHashMap<>();
                    point.put("label", dayFormatter.format(entry.getKey()));
                    point.put("value", entry.getValue());
                    return point;
                })
                .toList();

        int totalSuccessfulOrders = successfulOrders.size();
        BigDecimal safeRevenue = totalRevenue == null ? BigDecimal.ZERO : totalRevenue;
        BigDecimal averageOrderValue = totalSuccessfulOrders > 0
                ? safeRevenue.divide(BigDecimal.valueOf(totalSuccessfulOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        double returnRate = totalSuccessfulOrders > 0 ? (double) totalReturnRequests / totalSuccessfulOrders : 0;
        double conversionRate = users.size() > 0 ? (double) totalSuccessfulOrders / users.size() : 0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalProducts", products.size());
        metrics.put("totalUsers", users.size());
        metrics.put("totalSuccessfulOrders", totalSuccessfulOrders);
        metrics.put("totalSoldItems", totalSoldItems);
        metrics.put("totalRemainingItems", totalRemainingItems);
        metrics.put("totalRevenue", safeRevenue);
        metrics.put("averageOrderValue", averageOrderValue);
        metrics.put("returnRate", returnRate);
        metrics.put("conversionRate", conversionRate);
        metrics.put("totalReturnRequests", totalReturnRequests);
        metrics.put("completedReturns", completedReturns);
        metrics.put("supportOpenTickets", supportOpen);
        metrics.put("supportInProgressTickets", supportInProgress);
        metrics.put("supportResolvedTickets", supportResolved);
        metrics.put("supportClosedTickets", supportClosed);
        metrics.put("pendingOrders", orderRepository.countByOrderStatus(OrderStatus.PENDING));
        metrics.put("confirmedOrders", orderRepository.countByOrderStatus(OrderStatus.CONFIRMED));
        metrics.put("processingOrders", orderRepository.countByOrderStatus(OrderStatus.PROCESSING));
        metrics.put("shippedOrders", orderRepository.countByOrderStatus(OrderStatus.SHIPPED));
        metrics.put("outForDeliveryOrders", orderRepository.countByOrderStatus(OrderStatus.OUT_FOR_DELIVERY));
        metrics.put("deliveredOrders", orderRepository.countByOrderStatus(OrderStatus.DELIVERED));
        metrics.put("returnRequestedOrders", orderRepository.countByOrderStatus(OrderStatus.RETURN_REQUESTED));
        metrics.put("returnApprovedOrders", orderRepository.countByOrderStatus(OrderStatus.RETURN_APPROVED));
        metrics.put("refundedOrders", orderRepository.countByOrderStatus(OrderStatus.REFUNDED));
        metrics.put("cancelledOrders", orderRepository.countByOrderStatus(OrderStatus.CANCELLED));
        metrics.put("failedOrders", orderRepository.countByOrderStatus(OrderStatus.FAILED));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("categorySales", categorySales);
        analytics.put("dailyRevenue", dailyRevenueSeries);
        analytics.put("monthlyRevenue", dailyRevenueSeries);

        Map<String, Object> response = new HashMap<>();
        response.put("metrics", metrics);
        response.put("products", productRows);
        response.put("users", userRows);
        response.put("analytics", analytics);

        return response;
    }

    private boolean isSuccessful(OrderStatus status) {
        return status == OrderStatus.CONFIRMED
                || status == OrderStatus.PROCESSING
                || status == OrderStatus.SHIPPED
                || status == OrderStatus.OUT_FOR_DELIVERY
                || status == OrderStatus.DELIVERED
                || status == OrderStatus.SUCCESS;
    }
}






