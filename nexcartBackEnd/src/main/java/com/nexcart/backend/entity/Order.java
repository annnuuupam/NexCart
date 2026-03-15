package com.nexcart.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @Column(name = "order_id")
    private String orderId;

    @Column(name = "user_id", nullable = false)
    private int userId;

    @Column(name = "subtotal_amount", nullable = false)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "shipping_amount", nullable = false)
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "coupon_code", length = 80)
    private String couponCode;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    private OrderStatus orderStatus = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "tracking_number", length = 60)
    private String trackingNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (orderStatus == null) orderStatus = OrderStatus.PENDING;
        if (paymentStatus == null) paymentStatus = PaymentStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Order() {
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public BigDecimal getSubtotalAmount() { return subtotalAmount; }
    public void setSubtotalAmount(BigDecimal subtotalAmount) { this.subtotalAmount = subtotalAmount; }
    public BigDecimal getShippingAmount() { return shippingAmount; }
    public void setShippingAmount(BigDecimal shippingAmount) { this.shippingAmount = shippingAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }

    // Backward compatibility helpers
    public OrderStatus getStatus() { return orderStatus; }
    public void setStatus(OrderStatus status) { this.orderStatus = status; }
}
