package com.nexcart.backend.repository;

import com.nexcart.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.orderId = :orderId")
    List<OrderItem> findByOrderId(String orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.userId = :userId")
    List<OrderItem> findSuccessfulOrderItemsByUserId(int userId);

    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi WHERE oi.order.orderStatus IN ('CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS')")
    long sumSuccessfulItemsSold();
}
