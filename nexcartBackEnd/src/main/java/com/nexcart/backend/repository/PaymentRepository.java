package com.nexcart.backend.repository;

import com.nexcart.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(String orderId);
}
