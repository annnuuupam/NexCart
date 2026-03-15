package com.nexcart.backend.repository;

import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    @Query("SELECT o FROM Order o WHERE MONTH(o.createdAt) = :month AND YEAR(o.createdAt) = :year AND o.orderStatus IN ('CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS')")
    List<Order> findSuccessfulOrdersByMonthAndYear(int month, int year);

    @Query("SELECT o FROM Order o WHERE DATE(o.createdAt) = :date AND o.orderStatus IN ('CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS')")
    List<Order> findSuccessfulOrdersByDate(LocalDate date);

    @Query("SELECT o FROM Order o WHERE YEAR(o.createdAt) = :year AND o.orderStatus IN ('CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS')")
    List<Order> findSuccessfulOrdersByYear(int year);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus IN ('CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS')")
    BigDecimal calculateOverallBusiness();

    @Query("SELECT o FROM Order o WHERE o.orderStatus = :status")
    List<Order> findAllByOrderStatus(OrderStatus status);

    long countByOrderStatus(OrderStatus status);

    List<Order> findByUserId(Integer userId);

    long countByUserId(Integer userId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.userId = :userId AND o.orderStatus IN ('CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS')")
    BigDecimal calculateUserSuccessfulSpend(Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.orderId = :orderId")
    Optional<Order> findByIdForUpdate(@Param("orderId") String orderId);
}

