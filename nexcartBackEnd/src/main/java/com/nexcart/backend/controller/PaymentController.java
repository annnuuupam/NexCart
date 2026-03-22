package com.nexcart.backend.controller;

import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.InsufficientStockException;
import com.nexcart.backend.service.PaymentService;
import com.razorpay.RazorpayException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;
    @PostMapping("/create")
    public ResponseEntity<String> createPaymentOrder(@RequestBody Map<String, Object> requestBody,
                                                     HttpServletRequest request) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }

            Object discountRaw = requestBody.getOrDefault("discountAmount", requestBody.get("discount_amount"));
            BigDecimal discountAmount = discountRaw == null ? BigDecimal.ZERO : new BigDecimal(discountRaw.toString());
            String couponCode = stringOrNull(requestBody.get("couponCode"));
            String shippingAddress = stringOrNull(requestBody.get("shippingAddress"));
            String shippingCountry = stringOrNull(requestBody.get("shippingCountry"));
            String paymentMethod = stringOrNull(requestBody.get("paymentMethod"));

            List<Map<String, Object>> cartItemsRaw = (List<Map<String, Object>>) requestBody.get("cartItems");
            if (cartItemsRaw == null || cartItemsRaw.isEmpty()) {
                return ResponseEntity.badRequest().body("Cart is empty");
            }

            List<OrderItem> cartItems = cartItemsRaw.stream().map(item -> {
                OrderItem orderItem = new OrderItem();
                orderItem.setProductId(((Number) item.get("productId")).intValue());
                orderItem.setQuantity(((Number) item.get("quantity")).intValue());
                BigDecimal pricePerUnit = new BigDecimal(item.get("price").toString());
                orderItem.setPricePerUnit(pricePerUnit);
                orderItem.setTotalPrice(pricePerUnit.multiply(BigDecimal.valueOf(((Number) item.get("quantity")).intValue())));
                return orderItem;
            }).collect(Collectors.toList());

            String jsonResult = paymentService.createOrder(user.getUserId(), discountAmount, couponCode, shippingAddress, shippingCountry, paymentMethod, cartItems);
            return ResponseEntity.ok(jsonResult);

        } catch (RazorpayException e) {
            logger.error("Razorpay error creating order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating Razorpay order: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating payment order", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid request data: " + e.getMessage());
        }
    }

    @PostMapping("/cod")
    public ResponseEntity<?> placeCodOrder(@RequestBody Map<String, Object> requestBody,
                                           HttpServletRequest request) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }

            Object discountRaw = requestBody.getOrDefault("discountAmount", requestBody.get("discount_amount"));
            BigDecimal discountAmount = discountRaw == null ? BigDecimal.ZERO : new BigDecimal(discountRaw.toString());
            String couponCode = stringOrNull(requestBody.get("couponCode"));
            String shippingAddress = stringOrNull(requestBody.get("shippingAddress"));
            String shippingCountry = stringOrNull(requestBody.get("shippingCountry"));

            List<Map<String, Object>> cartItemsRaw = (List<Map<String, Object>>) requestBody.get("cartItems");
            if (cartItemsRaw == null || cartItemsRaw.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cart is empty"));
            }

            List<OrderItem> cartItems = cartItemsRaw.stream().map(item -> {
                OrderItem orderItem = new OrderItem();
                orderItem.setProductId(((Number) item.get("productId")).intValue());
                orderItem.setQuantity(((Number) item.get("quantity")).intValue());
                BigDecimal pricePerUnit = new BigDecimal(item.get("price").toString());
                orderItem.setPricePerUnit(pricePerUnit);
                orderItem.setTotalPrice(pricePerUnit.multiply(BigDecimal.valueOf(((Number) item.get("quantity")).intValue())));
                return orderItem;
            }).collect(Collectors.toList());

            Map<String, Object> result = paymentService.placeCodOrder(user.getUserId(), discountAmount, couponCode, shippingAddress, shippingCountry, cartItems);
            return ResponseEntity.ok(result);
        } catch (InsufficientStockException stockEx) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", stockEx.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating COD order", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyPayment(@RequestBody Map<String, Object> requestBody,
                                                HttpServletRequest request) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }

            String razorpayOrderId = getStr(requestBody, "razorpayOrderId", "razorpay_order_id");
            String razorpayPaymentId = getStr(requestBody, "razorpayPaymentId", "razorpay_payment_id");
            String razorpaySignature = getStr(requestBody, "razorpaySignature", "razorpay_signature");

            logger.info("Verify request: orderId={}, paymentId={}, userId={}", razorpayOrderId, razorpayPaymentId, user.getUserId());

            String result = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, user.getUserId());

            if ("SUCCESS".equals(result)) {
                return ResponseEntity.ok("Payment verified successfully");
            }

            if (result != null && result.startsWith("ERROR: ")) {
                String message = result.replace("ERROR: ", "");
                if (message.toLowerCase().contains("stock") || message.toLowerCase().contains("out of stock")) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
            }

            logger.warn("Payment verification failed: {}", result);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        } catch (Exception e) {
            logger.error("Error verifying payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error verifying payment: " + e.getMessage());
        }
    }

    private String getStr(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null && !val.toString().isBlank()) return val.toString();
        }
        return null;
    }

    private String stringOrNull(Object value) {
        if (value == null) return null;
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }
}


