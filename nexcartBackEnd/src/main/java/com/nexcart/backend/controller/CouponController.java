package com.nexcart.backend.controller;

import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.CouponService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }

            String code = payload.get("code") == null ? "" : payload.get("code").toString();
            Object subtotalRaw = payload.get("subtotal");
            if (subtotalRaw == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Subtotal is required"));
            }
            BigDecimal subtotal = new BigDecimal(subtotalRaw.toString());
            return ResponseEntity.ok(couponService.validateCoupon(code, subtotal));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to validate coupon"));
        }
    }
}
