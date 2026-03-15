package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Coupon;
import com.nexcart.backend.repository.CouponRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AdminCouponService {

    private final CouponRepository couponRepository;

    public AdminCouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public List<Coupon> getCoupons() {
        return couponRepository.findAll();
    }

    public Coupon createCoupon(Coupon coupon) {
        if (coupon.getCode() == null || coupon.getCode().isBlank()) {
            throw new IllegalArgumentException("Coupon code is required");
        }
        coupon.setCode(coupon.getCode().trim().toUpperCase());
        couponRepository.findByCodeIgnoreCase(coupon.getCode()).ifPresent(existing -> {
            throw new IllegalArgumentException("Coupon code already exists");
        });

        normalizeCoupon(coupon);
        return couponRepository.save(coupon);
    }

    public Coupon updateCoupon(Integer id, Coupon updates) {
        Coupon existing = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));

        if (updates.getCode() != null && !updates.getCode().isBlank()) {
            existing.setCode(updates.getCode().trim().toUpperCase());
        }
        if (updates.getDiscountType() != null && !updates.getDiscountType().isBlank()) {
            existing.setDiscountType(updates.getDiscountType().trim().toUpperCase());
        }
        if (updates.getDiscountValue() != null) {
            existing.setDiscountValue(updates.getDiscountValue());
        }
        if (updates.getExpiryDate() != null) {
            existing.setExpiryDate(updates.getExpiryDate());
        }
        if (updates.getUsageLimit() != null) {
            existing.setUsageLimit(updates.getUsageLimit());
        }
        if (updates.getMinimumOrderAmount() != null) {
            existing.setMinimumOrderAmount(updates.getMinimumOrderAmount());
        }
        if (updates.getMaximumDiscount() != null) {
            existing.setMaximumDiscount(updates.getMaximumDiscount());
        }
        if (updates.getActive() != null) {
            existing.setActive(updates.getActive());
        }

        normalizeCoupon(existing);
        return couponRepository.save(existing);
    }

    public Coupon updateCouponStatus(Integer id, boolean active) {
        Coupon existing = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        existing.setActive(active);
        return couponRepository.save(existing);
    }

    public void deleteCoupon(Integer id) {
        if (!couponRepository.existsById(id)) {
            throw new IllegalArgumentException("Coupon not found");
        }
        couponRepository.deleteById(id);
    }

    private void normalizeCoupon(Coupon coupon) {
        if (coupon.getDiscountValue() == null) {
            coupon.setDiscountValue(BigDecimal.ZERO);
        }
        if (coupon.getMinimumOrderAmount() == null) {
            coupon.setMinimumOrderAmount(BigDecimal.ZERO);
        }
        if (coupon.getMaximumDiscount() == null) {
            coupon.setMaximumDiscount(BigDecimal.ZERO);
        }
        if (coupon.getUsageLimit() == null || coupon.getUsageLimit() <= 0) {
            coupon.setUsageLimit(1);
        }
        if (coupon.getUsedCount() == null) {
            coupon.setUsedCount(0);
        }
        if (coupon.getActive() == null) {
            coupon.setActive(true);
        }
    }
}
