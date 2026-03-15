package com.nexcart.backend.repository;

import com.nexcart.backend.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Integer> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
}
