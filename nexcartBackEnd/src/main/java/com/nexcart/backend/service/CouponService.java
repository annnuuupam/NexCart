package com.nexcart.backend.service;

import com.nexcart.backend.entity.Coupon;
import com.nexcart.backend.repository.CouponRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public Map<String, Object> validateCoupon(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            throw new RuntimeException("Coupon code is required");
        }
        if (subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Subtotal must be greater than zero");
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

        LocalDate today = LocalDate.now();
        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new RuntimeException("Coupon is not active");
        }
        if (coupon.getExpiryDate().isBefore(today)) {
            throw new RuntimeException("Coupon has expired");
        }

        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new RuntimeException("Coupon usage limit reached");
        }

        BigDecimal minimumOrder = coupon.getMinimumOrderAmount() == null ? BigDecimal.ZERO : coupon.getMinimumOrderAmount();
        if (minimumOrder.compareTo(BigDecimal.ZERO) > 0 && subtotal.compareTo(minimumOrder) < 0) {
            throw new RuntimeException("Order must be at least Rs. " + minimumOrder + " to use this coupon");
        }

        BigDecimal discountAmount;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = coupon.getDiscountValue();
        }

        BigDecimal maxDiscount = coupon.getMaximumDiscount() == null ? BigDecimal.ZERO : coupon.getMaximumDiscount();
        if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discountAmount.compareTo(maxDiscount) > 0) {
            discountAmount = maxDiscount;
        }

        if (discountAmount.compareTo(subtotal) > 0) discountAmount = subtotal;

        BigDecimal finalAmount = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

        long daysLeft = ChronoUnit.DAYS.between(today, coupon.getExpiryDate());

        Map<String, Object> result = new HashMap<>();
        result.put("code", coupon.getCode());
        result.put("discountType", coupon.getDiscountType());
        result.put("discountValue", coupon.getDiscountValue());
        result.put("discountAmount", discountAmount.setScale(2, RoundingMode.HALF_UP));
        result.put("finalAmount", finalAmount);
        result.put("expiryDate", coupon.getExpiryDate());
        result.put("daysLeft", Math.max(daysLeft, 0));
        result.put("usedCount", coupon.getUsedCount());
        result.put("usageLimit", coupon.getUsageLimit());
        result.put("minimumOrderAmount", minimumOrder);
        result.put("maximumDiscount", maxDiscount);
        result.put("active", coupon.getActive());
        return result;
    }
}
