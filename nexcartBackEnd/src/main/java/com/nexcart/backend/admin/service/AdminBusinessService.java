package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Order;
import com.nexcart.backend.entity.OrderItem;
import com.nexcart.backend.entity.OrderStatus;
import com.nexcart.backend.repository.OrderRepository;
import com.nexcart.backend.repository.OrderItemRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.entity.Category;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminBusinessService {

	private final OrderRepository orderRepository;
	private final OrderItemRepository orderItemRepository;
	private final ProductRepository productRepository;

	public AdminBusinessService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, ProductRepository productRepository) {
		this.orderRepository = orderRepository;
		this.orderItemRepository = orderItemRepository;
		this.productRepository = productRepository;
	}


	public Map<String, Object> calculateMonthlyBusiness(int month, int year) {
		if (month < 1 || month > 12) {
			throw new IllegalArgumentException("Invalid month: " + month);
		}
		if (year < 2000 || year > 2100) { // Adjust range as needed
			throw new IllegalArgumentException("Invalid year: " + year);
		}

		List<Order> successfulOrders = orderRepository.findSuccessfulOrdersByMonthAndYear(month, year);

		double totalBusiness = 0.0;
		Map<String, Integer> categorySales = new HashMap<>();

		for (Order order : successfulOrders) {
			totalBusiness += order.getTotalAmount().doubleValue();

			List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getOrderId());
			for (OrderItem item : orderItems) {
				String categoryName = productRepository.findCategoryNameByProductId(item.getProductId());
				categorySales.put(categoryName, categorySales.getOrDefault(categoryName, 0) + item.getQuantity());
			}
		}

		Map<String, Object> businessReport = new HashMap<>();
		businessReport.put("totalBusiness", totalBusiness);
		businessReport.put("categorySales", categorySales);

		return businessReport;
	}

	public Map<String, Object> calculateDailyBusiness(LocalDate date) {
		if (date == null) {
			throw new IllegalArgumentException("Invalid date: Date cannot be null");
		}

		List<Order> successfulOrders = orderRepository.findSuccessfulOrdersByDate(date);

		double totalBusiness = 0.0;
		Map<String, Integer> categorySales = new HashMap<>();

		for (Order order : successfulOrders) {
			totalBusiness += order.getTotalAmount().doubleValue();

			List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getOrderId());
			for (OrderItem item : orderItems) {
				String categoryName = productRepository.findCategoryNameByProductId(item.getProductId());
				categorySales.put(categoryName, categorySales.getOrDefault(categoryName, 0) + item.getQuantity());
			}
		}

		Map<String, Object> businessReport = new HashMap<>();
		businessReport.put("totalBusiness", totalBusiness);
		businessReport.put("categorySales", categorySales);

		return businessReport;
	}

	public Map<String, Object> calculateYearlyBusiness(int year) {
        if (year < 2000 || year > 2100) { // Adjust range as needed
            throw new IllegalArgumentException("Invalid year: " + year);
        }

        List<Order> successfulOrders = orderRepository.findSuccessfulOrdersByYear(year);

        double totalBusiness = 0.0;
        Map<String, Integer> categorySales = new HashMap<>();

        for (Order order : successfulOrders) {
            totalBusiness += order.getTotalAmount().doubleValue();

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getOrderId());
            for (OrderItem item : orderItems) {
                String categoryName = productRepository.findCategoryNameByProductId(item.getProductId());
                categorySales.put(categoryName, categorySales.getOrDefault(categoryName, 0) + item.getQuantity());
            }
        }

        Map<String, Object> businessReport = new HashMap<>();
        businessReport.put("totalBusiness", totalBusiness);
        businessReport.put("categorySales", categorySales);

        return businessReport;
    }

	public Map<String, Object> calculateOverallBusiness() {
	    BigDecimal totalBusinessAmount = orderRepository.calculateOverallBusiness();
	    List<Order> successfulOrders = orderRepository.findAll().stream()
                .filter(order -> isSuccessful(order.getOrderStatus()))
                .collect(Collectors.toList());

	    Map<String, Integer> categorySales = new HashMap<>();
	    for (Order order : successfulOrders) {
	        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getOrderId());
	        for (OrderItem item : orderItems) {
	            String categoryName = productRepository.findCategoryNameByProductId(item.getProductId());
	            categorySales.put(categoryName, categorySales.getOrDefault(categoryName, 0) + item.getQuantity());
	        }
	    }

	    Map<String, Object> response = new HashMap<>();
	    response.put("totalBusiness", totalBusinessAmount.doubleValue());
	    response.put("categorySales", categorySales);
	    return response;
	}

    private boolean isSuccessful(OrderStatus status) {
        return status == OrderStatus.CONFIRMED
                || status == OrderStatus.PROCESSING
                || status == OrderStatus.SHIPPED
                || status == OrderStatus.OUT_FOR_DELIVERY
                || status == OrderStatus.DELIVERED
                || status == OrderStatus.SUCCESS;
    }
}
