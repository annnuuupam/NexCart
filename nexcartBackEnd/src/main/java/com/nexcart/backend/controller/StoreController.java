package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Coupon;
import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderStatus;
import com.nexcart.backend.repository.CouponRepository;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.service.SystemSettingsService;
import com.nexcart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176"}, allowCredentials = "true")
@RequestMapping("/api/store")
public class StoreController {

    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final SystemSettingsService systemSettingsService;

    @Value("${razorpay.key_id:}")
    private String razorpayKeyId;

    public StoreController(CouponRepository couponRepository,
                           UserRepository userRepository,
                           OrderRepository orderRepository,
                           OrderItemRepository orderItemRepository,
                           ProductRepository productRepository,
                           SystemSettingsService systemSettingsService) {
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.systemSettingsService = systemSettingsService;
    }

    @GetMapping("/highlights")
    public ResponseEntity<Map<String, Object>> getHighlights() {
        LocalDate today = LocalDate.now();
        int activeOffers = 0;

        List<Coupon> coupons = couponRepository.findAll();
        for (Coupon coupon : coupons) {
            boolean notExpired = coupon.getExpiryDate() != null && !coupon.getExpiryDate().isBefore(today);
            boolean usageAvailable = coupon.getUsageLimit() != null
                    && coupon.getUsedCount() != null
                    && coupon.getUsedCount() < coupon.getUsageLimit();
            boolean isActive = Boolean.TRUE.equals(coupon.getActive());
            if (notExpired && usageAvailable && isActive) {
                activeOffers++;
            }
        }

        Map<String, Object> paymentConfig = systemSettingsService.getPaymentMethods();
        List<String> paymentMethods = new ArrayList<>();
        if (Boolean.TRUE.equals(paymentConfig.get("razorpay"))) paymentMethods.add("Razorpay");
        if (Boolean.TRUE.equals(paymentConfig.get("stripe"))) paymentMethods.add("Stripe");
        if (Boolean.TRUE.equals(paymentConfig.get("paypal"))) paymentMethods.add("PayPal");
        if (Boolean.TRUE.equals(paymentConfig.get("cod"))) paymentMethods.add("Cash on Delivery");

        Map<String, Object> response = new HashMap<>();
        response.put("deliveryEstimate", systemSettingsService.getSettings().getOrDefault("dispatch_sla_hours", "24") + "h dispatch");
        response.put("activeOfferCount", activeOffers);
        response.put("paymentMethods", paymentMethods);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/about")
    public ResponseEntity<Map<String, Object>> getAboutStats() {
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        long successfulOrders = orderRepository.findAll().stream().filter(order -> isSuccessful(order.getOrderStatus())).count();
        long totalItemsSold = orderItemRepository.sumSuccessfulItemsSold();
        BigDecimal totalRevenue = orderRepository.calculateOverallBusiness();

        double successRate = totalOrders == 0
                ? 100.0
                : Math.min(100.0, (successfulOrders * 100.0) / totalOrders);

        String fulfillmentSla = successRate >= 95.0
                ? "95%+ orders processed within 24 hours"
                : "Orders processed within 24-48 hours";

        Map<String, Object> response = new HashMap<>();
        response.put("activeShoppers", totalUsers);
        response.put("citiesServed", 350);
        response.put("productSkus", totalProducts);
        response.put("avgDelivery", "2-4 days");
        response.put("ordersServed", successfulOrders);
        response.put("itemsSold", totalItemsSold);
        response.put("totalRevenue", totalRevenue);
        response.put("fulfillmentSla", fulfillmentSla);
        response.put("orderSuccessRate", Math.round(successRate * 10.0) / 10.0);

        return ResponseEntity.ok(response);
    }

    private boolean isSuccessful(OrderStatus status) {
        return status == OrderStatus.CONFIRMED
                || status == OrderStatus.PROCESSING
                || status == OrderStatus.SHIPPED
                || status == OrderStatus.OUT_FOR_DELIVERY
                || status == OrderStatus.DELIVERED
                || status == OrderStatus.SUCCESS;
    }    @GetMapping("/coupons")
    public ResponseEntity<Map<String, Object>> getActiveCoupons() {
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> availableCoupons = couponRepository.findAll().stream()
                .filter(coupon -> coupon.getExpiryDate() != null && !coupon.getExpiryDate().isBefore(today))
                .filter(coupon -> Boolean.TRUE.equals(coupon.getActive()))
                .filter(coupon -> coupon.getUsageLimit() == null
                        || coupon.getUsedCount() == null
                        || coupon.getUsedCount() < coupon.getUsageLimit())
                .map(coupon -> {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("code", coupon.getCode());
                    payload.put("discountType", coupon.getDiscountType());
                    payload.put("discountValue", coupon.getDiscountValue());
                    payload.put("minimumOrderAmount", coupon.getMinimumOrderAmount());
                    payload.put("maximumDiscount", coupon.getMaximumDiscount());
                    payload.put("expiryDate", coupon.getExpiryDate());
                    return payload;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("coupons", availableCoupons));
    }
}
