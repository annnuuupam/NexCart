package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminCouponService;
import com.nexcart.backend.entity.Coupon;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/coupons")
public class AdminCouponController {

    private final AdminCouponService adminCouponService;

    public AdminCouponController(AdminCouponService adminCouponService) {
        this.adminCouponService = adminCouponService;
    }

    @GetMapping
    public ResponseEntity<?> getCoupons() {
        try {
            return ResponseEntity.ok(adminCouponService.getCoupons());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load coupons");
        }
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon) {
        try {
            return ResponseEntity.ok(adminCouponService.createCoupon(coupon));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create coupon");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(@PathVariable("id") Integer id, @RequestBody Coupon coupon) {
        try {
            return ResponseEntity.ok(adminCouponService.updateCoupon(id, coupon));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update coupon");
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateCouponStatus(@PathVariable("id") Integer id, @RequestBody Map<String, Object> payload) {
        try {
            boolean active = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("active", "true")));
            return ResponseEntity.ok(adminCouponService.updateCouponStatus(id, active));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update coupon status");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable("id") Integer id) {
        try {
            adminCouponService.deleteCoupon(id);
            return ResponseEntity.ok(Map.of("message", "Coupon deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete coupon");
        }
    }
}
