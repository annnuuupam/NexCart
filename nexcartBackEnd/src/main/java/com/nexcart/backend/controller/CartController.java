package com.nexcart.backend.controller;

import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.UserRepository;
import com.nexcart.backend.service.CartService;
import com.nexcart.backend.service.InsufficientStockException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/items/count")
    public ResponseEntity<Integer> getCartItemCount(@RequestParam(name = "username", required = false) String username,
                                                     HttpServletRequest request) {
        User user = resolveUser(request, username);
        int count = cartService.getCartItemCount(user.getUserId());
        return ResponseEntity.ok(count);
    }

    @GetMapping("/items")
    public ResponseEntity<Map<String, Object>> getCartItems(HttpServletRequest request) {
        User user = resolveUser(request, null);
        Map<String, Object> cartItems = cartService.getCartItems(user.getUserId());
        return ResponseEntity.ok(cartItems);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            User user = resolveUser(request, requestBody.get("username") == null ? null : requestBody.get("username").toString());
            int productId = extractInt(requestBody, "productId", "product_id");
            int quantity = requestBody.containsKey("quantity") ? extractInt(requestBody, "quantity") : 1;

            cartService.addToCart(user.getUserId(), productId, quantity);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Item added to cart"));
        } catch (InsufficientStockException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateCartItemQuantity(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            User user = resolveUser(request, requestBody.get("username") == null ? null : requestBody.get("username").toString());
            int productId = extractInt(requestBody, "productId", "product_id");
            int quantity = extractInt(requestBody, "quantity");

            cartService.updateCartItemQuantity(user.getUserId(), productId, quantity);
            return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "Cart updated"));
        } catch (InsufficientStockException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteCartItem(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        User user = resolveUser(request, requestBody.get("username") == null ? null : requestBody.get("username").toString());
        int productId = extractInt(requestBody, "productId", "product_id");

        cartService.deleteCartItem(user.getUserId(), productId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    private User resolveUser(HttpServletRequest request, String username) {
        User authenticated = (User) request.getAttribute("authenticatedUser");
        if (authenticated != null) {
            return userRepository.findById(authenticated.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
        }

        if (username != null && !username.isBlank()) {
            return userRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));
        }

        throw new IllegalArgumentException("User not authenticated");
    }

    private int extractInt(Map<String, Object> requestBody, String... keys) {
        for (String key : keys) {
            Object value = requestBody.get(key);
            if (value instanceof Number number) {
                return number.intValue();
            }
            if (value instanceof String stringValue && !stringValue.isBlank()) {
                return Integer.parseInt(stringValue);
            }
        }
        throw new IllegalArgumentException("Missing numeric field: " + String.join("/", keys));
    }
}
