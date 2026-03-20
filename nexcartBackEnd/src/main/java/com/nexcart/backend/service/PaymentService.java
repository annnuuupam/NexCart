package com.nexcart.backend.service;

import com.nexcart.backend.entity.CartItem;
import com.nexcart.backend.entity.Coupon;
import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.OrderStatus;
import com.nexcart.backend.entity.Payment;
import com.nexcart.backend.entity.PaymentStatus;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.ProductStatus;
import com.nexcart.backend.repository.CartRepository;
import com.nexcart.backend.repository.CouponRepository;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.PaymentRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key_id}")
    private String razorpayKeyId;

    @Value("${razorpay.key_secret}")
    private String razorpayKeySecret;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final ProductRepository productRepository;
    private final SystemSettingsService systemSettingsService;
    private final NotificationService notificationService;

    public PaymentService(OrderRepository orderRepository,
                          OrderItemRepository orderItemRepository,
                          CartRepository cartRepository,
                          PaymentRepository paymentRepository,
                          CouponRepository couponRepository,
                          ProductRepository productRepository,
                          SystemSettingsService systemSettingsService,
                          NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.paymentRepository = paymentRepository;
        this.couponRepository = couponRepository;
        this.productRepository = productRepository;
        this.systemSettingsService = systemSettingsService;
        this.notificationService = notificationService;
    }

    @Transactional
    public String createOrder(int userId, BigDecimal discountAmount, String couponCode,
                              String shippingAddress, String shippingCountry, String paymentMethod, List<OrderItem> cartItems) throws RazorpayException {
        Totals totals = calculateTotals(cartItems, shippingCountry, discountAmount);

        RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

        var orderRequest = new JSONObject();
        orderRequest.put("amount", totals.total.multiply(BigDecimal.valueOf(100)).intValue());
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        String razorpayOrderId = razorpayOrder.get("id");
        int razorpayAmount = razorpayOrder.get("amount");

        logger.info("Razorpay order created: id={}, amount={}", razorpayOrderId, razorpayAmount);

        LocalDateTime now = LocalDateTime.now();
        Order order = new Order();
        order.setOrderId(razorpayOrderId);
        order.setUserId(userId);
        order.setSubtotalAmount(totals.subtotal);
        order.setShippingAmount(totals.shipping);
        order.setTaxAmount(totals.tax);
        order.setTotalAmount(totals.total);
        order.setDiscountAmount(discountAmount == null ? BigDecimal.ZERO : discountAmount);
        order.setCouponCode(couponCode == null || couponCode.isBlank() ? null : couponCode.trim().toUpperCase());
        order.setShippingAddress(shippingAddress);
        order.setPaymentMethod(paymentMethod == null ? "RAZORPAY" : paymentMethod.toUpperCase());
        order.setOrderStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        orderRepository.save(order);
        notificationService.createAdminNotification(
                "New order " + razorpayOrderId + " placed",
                "A new order has been created with total Rs. " + totals.total,
                "ORDER",
                "/admindashboard/orders"
        );
        notificationService.createUserNotification(
                userId,
                "Order " + razorpayOrderId + " placed",
                "Your order has been placed successfully.",
                "ORDER",
                "/orders"
        );

        Payment payment = paymentRepository.findByOrderId(razorpayOrderId).orElseGet(Payment::new);
        payment.setOrderId(razorpayOrderId);
        payment.setUserId(userId);
        payment.setAmount(totals.total);
        payment.setStatus("PENDING");
        paymentRepository.save(payment);

        JSONObject result = new JSONObject();
        result.put("orderId", razorpayOrderId);
        result.put("amount", razorpayAmount);
        result.put("subtotal", totals.subtotal);
        result.put("shipping", totals.shipping);
        result.put("tax", totals.tax);
        result.put("total", totals.total);
        return result.toString();
    }

    @Transactional
    public java.util.Map<String, Object> placeCodOrder(int userId, BigDecimal discountAmount, String couponCode,
                                                       String shippingAddress, String shippingCountry, List<OrderItem> cartItems) {
        Totals totals = calculateTotals(cartItems, shippingCountry, discountAmount);
        String orderId = "COD_" + System.currentTimeMillis();

        LocalDateTime now = LocalDateTime.now();
        Order order = new Order();
        order.setOrderId(orderId);
        order.setUserId(userId);
        order.setSubtotalAmount(totals.subtotal);
        order.setShippingAmount(totals.shipping);
        order.setTaxAmount(totals.tax);
        order.setTotalAmount(totals.total);
        order.setDiscountAmount(discountAmount == null ? BigDecimal.ZERO : discountAmount);
        order.setCouponCode(couponCode == null || couponCode.isBlank() ? null : couponCode.trim().toUpperCase());
        order.setShippingAddress(shippingAddress);
        order.setPaymentMethod("COD");
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        orderRepository.save(order);
        notificationService.createAdminNotification(
                "New order " + orderId + " placed",
                "A new COD order has been placed with total Rs. " + totals.total,
                "ORDER",
                "/admindashboard/orders"
        );
        notificationService.createUserNotification(
                userId,
                "Order " + orderId + " placed",
                "Your order has been placed successfully.",
                "ORDER",
                "/orders"
        );

        Payment payment = new Payment();
        payment.setOrderId(orderId);
        payment.setUserId(userId);
        payment.setAmount(totals.total);
        payment.setStatus("COD_PENDING");
        paymentRepository.save(payment);

        List<CartItem> cartItemsDb = cartRepository.findCartItemsWithProductDetails(userId);
        List<CartItem> sortedItems = cartItemsDb.stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getProductId()))
                .toList();

        for (CartItem cartItem : sortedItems) {
            int productId = cartItem.getProduct().getProductId();
            int quantity = cartItem.getQuantity();

            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new InsufficientStockException("Product not found"));

            int availableStock = product.getStock() == null ? 0 : product.getStock();
            if (availableStock < quantity) {
                throw new InsufficientStockException("Only " + availableStock + " items left for " + product.getName());
            }

            product.setStock(availableStock - quantity);
            product.setProductStatus(product.getStock() > 0 ? ProductStatus.AVAILABLE : ProductStatus.OUT_OF_STOCK);
            productRepository.save(product);
            maybeNotifyLowStock(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(productId);
            orderItem.setQuantity(quantity);
            orderItem.setPricePerUnit(cartItem.getProduct().getPrice());
            orderItem.setTotalPrice(cartItem.getProduct().getPrice().multiply(BigDecimal.valueOf(quantity)));
            orderItemRepository.save(orderItem);
        }

        cartRepository.deleteAllCartItemsByUserId(userId);
        return java.util.Map.of(
                "orderId", orderId,
                "subtotal", totals.subtotal,
                "shipping", totals.shipping,
                "tax", totals.tax,
                "total", totals.total
        );
    }

    @Transactional
    public String verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature, int userId) {
        if (razorpayOrderId == null || razorpayOrderId.isBlank()) return "ERROR: razorpayOrderId is missing";
        if (razorpayPaymentId == null || razorpayPaymentId.isBlank()) return "ERROR: razorpayPaymentId is missing";
        if (razorpaySignature == null || razorpaySignature.isBlank()) return "ERROR: razorpaySignature is missing";

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);

            boolean isSignatureValid = com.razorpay.Utils.verifyPaymentSignature(attributes, razorpayKeySecret);

            Payment payment = paymentRepository.findByOrderId(razorpayOrderId).orElseGet(Payment::new);
            payment.setOrderId(razorpayOrderId);
            payment.setUserId(userId);
            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setRazorpaySignature(razorpaySignature);

            if (!isSignatureValid) {
                payment.setStatus("FAILED");
                paymentRepository.save(payment);
                Order order = orderRepository.findByIdForUpdate(razorpayOrderId).orElse(null);
                if (order != null) {
                    order.setOrderStatus(OrderStatus.FAILED);
                    order.setPaymentStatus(PaymentStatus.FAILED);
                    order.setUpdatedAt(LocalDateTime.now());
                    orderRepository.save(order);
                }
                return "ERROR: Signature verification failed";
            }

            Order order = orderRepository.findByIdForUpdate(razorpayOrderId).orElse(null);
            if (order != null && order.getOrderStatus() == OrderStatus.CONFIRMED) {
                return "SUCCESS";
            }

            List<CartItem> cartItems = cartRepository.findCartItemsWithProductDetails(userId);
            if (cartItems == null || cartItems.isEmpty()) {
                throw new InsufficientStockException("Cart is empty or already cleared");
            }

            List<CartItem> sortedItems = cartItems.stream()
                    .sorted(Comparator.comparing(item -> item.getProduct().getProductId()))
                    .toList();

            for (CartItem cartItem : sortedItems) {
                int productId = cartItem.getProduct().getProductId();
                int quantity = cartItem.getQuantity();

                Product product = productRepository.findByIdForUpdate(productId)
                        .orElseThrow(() -> new InsufficientStockException("Product not found"));

                int availableStock = product.getStock() == null ? 0 : product.getStock();
                if (availableStock < quantity) {
                    throw new InsufficientStockException("Only " + availableStock + " items left for " + product.getName());
                }

                product.setStock(availableStock - quantity);
                product.setProductStatus(product.getStock() > 0 ? ProductStatus.AVAILABLE : ProductStatus.OUT_OF_STOCK);
                productRepository.save(product);
                maybeNotifyLowStock(product);
            }

            if (order != null) {
                order.setOrderStatus(OrderStatus.CONFIRMED);
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
                payment.setAmount(order.getTotalAmount());

                if (order.getCouponCode() != null && !order.getCouponCode().isBlank()) {
                    couponRepository.findByCodeIgnoreCase(order.getCouponCode()).ifPresent(coupon -> {
                        if (Boolean.TRUE.equals(coupon.getActive()) &&
                                (coupon.getExpiryDate().isEqual(LocalDate.now()) || coupon.getExpiryDate().isAfter(LocalDate.now()))
                                && coupon.getUsedCount() < coupon.getUsageLimit()) {
                            coupon.setUsedCount(coupon.getUsedCount() + 1);
                            couponRepository.save(coupon);
                        }
                    });
                }
            }

            payment.setStatus("SUCCESS");
            paymentRepository.save(payment);

            try {
                if (order != null) {
                    for (CartItem cartItem : sortedItems) {
                        OrderItem orderItem = new OrderItem();
                        orderItem.setOrder(order);
                        orderItem.setProductId(cartItem.getProduct().getProductId());
                        orderItem.setQuantity(cartItem.getQuantity());
                        orderItem.setPricePerUnit(cartItem.getProduct().getPrice());
                        orderItem.setTotalPrice(cartItem.getProduct().getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
                        orderItemRepository.save(orderItem);
                    }
                }
                cartRepository.deleteAllCartItemsByUserId(userId);
            } catch (Exception cartEx) {
                logger.error("Failed to save order items or clear cart (payment already verified): {}", cartEx.getMessage(), cartEx);
            }

            return "SUCCESS";
        } catch (InsufficientStockException stockEx) {
            logger.warn("Stock validation failed: {}", stockEx.getMessage());
            return "ERROR: " + stockEx.getMessage();
        } catch (Exception e) {
            logger.error("Payment verification exception: {}", e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    @Transactional
    public void saveOrderItems(String orderId, List<OrderItem> items) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        for (OrderItem item : items) {
            item.setOrder(order);
            orderItemRepository.save(item);
        }
    }

    private Totals calculateTotals(List<OrderItem> cartItems, String shippingCountry, BigDecimal discountAmount) {
        BigDecimal subtotal = BigDecimal.ZERO;
        if (cartItems != null) {
            for (OrderItem item : cartItems) {
                if (item == null) continue;
                BigDecimal price = item.getPricePerUnit() == null ? BigDecimal.ZERO : item.getPricePerUnit();
                int qty = item.getQuantity();
                subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(qty)));
            }
        }

        BigDecimal discount = discountAmount == null ? BigDecimal.ZERO : discountAmount;
        BigDecimal freeThreshold = systemSettingsService.getBigDecimalSetting("free_shipping_threshold");
        BigDecimal domesticCharge = systemSettingsService.getBigDecimalSetting("domestic_shipping_charge");
        BigDecimal internationalCharge = systemSettingsService.getBigDecimalSetting("international_shipping_charge");
        boolean taxEnabled = systemSettingsService.getBooleanSetting("tax_enabled");
        BigDecimal gstPercentage = systemSettingsService.getBigDecimalSetting("gst_percentage");

        boolean isInternational = shippingCountry != null && !shippingCountry.isBlank() && !"india".equalsIgnoreCase(shippingCountry.trim());
        BigDecimal shipping = subtotal.compareTo(freeThreshold) >= 0 ? BigDecimal.ZERO : (isInternational ? internationalCharge : domesticCharge);

        BigDecimal taxable = subtotal.add(shipping).subtract(discount).max(BigDecimal.ZERO);
        BigDecimal tax = taxEnabled ? taxable.multiply(gstPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        BigDecimal total = taxable.add(tax).max(BigDecimal.ZERO);
        return new Totals(subtotal, shipping, tax, total);
    }

    private void maybeNotifyLowStock(Product product) {
        if (product == null || product.getStock() == null) return;
        if (product.getStock() > 5) return;

        String link = "/admindashboard/products?productId=" + product.getProductId();
        if (notificationService.hasUnreadAdminNotification("STOCK", link)) {
            return;
        }

        notificationService.createAdminNotification(
                "Low stock alert",
                "Product \"" + product.getName() + "\" is running low on stock (" + product.getStock() + " remaining).",
                "STOCK",
                link
        );
    }

    private record Totals(BigDecimal subtotal, BigDecimal shipping, BigDecimal tax, BigDecimal total) {}
}
