package com.nexcart.backend.repository;

import com.nexcart.backend.entity.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    Optional<ReturnRequest> findByUserIdAndOrderIdAndProductId(Integer userId, String orderId, Integer productId);
    Optional<ReturnRequest> findByOrderIdAndProductId(String orderId, Integer productId);
    Optional<ReturnRequest> findByOrderId(String orderId);
    List<ReturnRequest> findAllByOrderId(String orderId);
    List<ReturnRequest> findByUserId(Integer userId);
}
