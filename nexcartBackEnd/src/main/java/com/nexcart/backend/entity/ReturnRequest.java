package com.nexcart.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "returns")
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 120)
    private String orderId;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "reason", length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private ReturnRequestType requestType = ReturnRequestType.RETURN;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReturnRequestStatus status = ReturnRequestStatus.REQUESTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 20)
    private RefundStatus refundStatus = RefundStatus.PENDING;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reference", length = 120)
    private String refundReference;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (requestedAt == null) requestedAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = ReturnRequestStatus.REQUESTED;
        if (requestType == null) requestType = ReturnRequestType.RETURN;
        if (refundStatus == null) refundStatus = RefundStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public ReturnRequestType getRequestType() { return requestType; }
    public void setRequestType(ReturnRequestType requestType) { this.requestType = requestType; }

    public ReturnRequestStatus getStatus() { return status; }
    public void setStatus(ReturnRequestStatus status) { this.status = status; }

    public RefundStatus getRefundStatus() { return refundStatus; }
    public void setRefundStatus(RefundStatus refundStatus) { this.refundStatus = refundStatus; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public String getRefundReference() { return refundReference; }
    public void setRefundReference(String refundReference) { this.refundReference = refundReference; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
