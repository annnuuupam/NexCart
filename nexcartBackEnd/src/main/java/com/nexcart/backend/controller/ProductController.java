package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.Review;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.ProductService;
import com.nexcart.backend.service.ReviewService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/products")
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "24") Integer size,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            int safePage = page == null ? 0 : Math.max(page, 0);
            int safeSize = size == null ? 24 : Math.min(Math.max(size, 1), 100);

            Page<Product> productPage = productService.getProducts(category, query, safePage, safeSize);
            List<Product> products = productPage.getContent();
            logger.info("Fetched {} products for category={} query={} page={} size={}", products.size(), category, query, safePage, safeSize);

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", authenticatedUser.getUsername());
            userInfo.put("name", authenticatedUser.getUsername());
            userInfo.put("role", authenticatedUser.getRole().name());

            List<Map<String, Object>> productList = new ArrayList<>();
            for (Product product : products) {
                try {
                    Map<String, Object> p = new HashMap<>();
                    p.put("product_id", product.getProductId());
                    p.put("productId", product.getProductId());
                    p.put("id", product.getProductId());
                    p.put("name", product.getName());
                    p.put("description", product.getDescription());
                    p.put("price", product.getPrice());
                    p.put("stock", product.getStock());
                    p.put("stock_quantity", product.getStock());
                    p.put("product_status", String.valueOf(product.getProductStatus()));

                    try {
                        if (product.getCategory() != null) {
                            p.put("categoryName", product.getCategory().getCategoryName());
                        } else {
                            p.put("categoryName", "");
                        }
                    } catch (Exception catEx) {
                        p.put("categoryName", "");
                        logger.warn("Could not load category for product {}: {}", product.getProductId(), catEx.getMessage());
                    }

                    try {
                        List<String> images = productService.getProductImages(product.getProductId());
                        String primaryImage = (images != null && !images.isEmpty()) ? images.get(0) : null;
                        p.put("image_url", primaryImage);
                        p.put("imageUrl", primaryImage);
                        p.put("images", images != null ? images : new ArrayList<>());
                    } catch (Exception imgEx) {
                        p.put("image_url", null);
                        p.put("imageUrl", null);
                        p.put("images", new ArrayList<>());
                        logger.warn("Could not load images for product {}: {}", product.getProductId(), imgEx.getMessage());
                    }

                    productList.add(p);
                } catch (Exception productEx) {
                    logger.warn("Skipping product due to error: {}", productEx.getMessage());
                }
            }

            response.put("user", userInfo);
            response.put("products", productList);
            response.put("pagination", Map.of(
                    "page", productPage.getNumber(),
                    "size", productPage.getSize(),
                    "totalPages", productPage.getTotalPages(),
                    "totalElements", productPage.getTotalElements(),
                    "hasNext", productPage.hasNext(),
                    "hasPrevious", productPage.hasPrevious()
            ));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Critical error in getProducts: {}", e.getMessage(), e);
            response.put("error", "Server error: " + e.getMessage());
            response.put("products", new ArrayList<>());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductDetails(@PathVariable("id") Integer id, HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Product product = productService.getProductById(id);
            List<String> images = productService.getProductImages(id);
            List<Review> reviews = reviewService.getReviewsByProduct(id);

            Map<String, Object> response = new HashMap<>();
            response.put("productId", product.getProductId());
            response.put("name", product.getName());
            response.put("description", product.getDescription());
            response.put("price", product.getPrice());
            response.put("stock", product.getStock());
            response.put("stock_quantity", product.getStock());
            response.put("product_status", String.valueOf(product.getProductStatus()));
            response.put("categoryName", product.getCategory() != null ? product.getCategory().getCategoryName() : "");
            response.put("images", images);
            response.put("reviews", reviews);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load product details"));
        }
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<?> getInventory(@PathVariable("id") Integer id, HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Product product = productService.getProductById(id);
            return ResponseEntity.ok(Map.of(
                    "productId", product.getProductId(),
                    "stock", product.getStock(),
                    "stock_quantity", product.getStock(),
                    "product_status", String.valueOf(product.getProductStatus())
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load inventory"));
        }
    }

    @GetMapping("/availability")
    public ResponseEntity<?> getAvailability(@RequestParam("ids") String ids, HttpServletRequest request) {
        try {
            User authenticatedUser = (User) request.getAttribute("authenticatedUser");
            if (authenticatedUser == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            List<Integer> productIds = Arrays.stream(ids.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());

            List<Product> products = productService.getProductsByIds(productIds);
            List<Map<String, Object>> payload = products.stream().map(product -> {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("productId", product.getProductId());
                item.put("stock", product.getStock());
                item.put("stock_quantity", product.getStock());
                item.put("product_status", String.valueOf(product.getProductStatus()));
                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("items", payload));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load availability"));
        }
    }
}

