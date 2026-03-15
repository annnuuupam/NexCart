package com.nexcart.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            return ResponseEntity.ok(Map.of("message", "User registered successfully", "user", registeredUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        User authenticatedUser = (User) request.getAttribute("authenticatedUser");
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        try {
            User user = userService.getProfile(authenticatedUser.getUserId());
            return ResponseEntity.ok(toUserResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates, HttpServletRequest request) {
        User authenticatedUser = (User) request.getAttribute("authenticatedUser");
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        try {
            User updatedUser = userService.updateProfile(authenticatedUser.getUserId(), updates);
            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "user", toUserResponse(updatedUser)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        User authenticatedUser = (User) request.getAttribute("authenticatedUser");
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        try {
            String currentPassword = payload.getOrDefault("currentPassword", "");
            String newPassword = payload.getOrDefault("newPassword", "");
            String confirmPassword = payload.getOrDefault("confirmPassword", "");

            if (!newPassword.equals(confirmPassword)) {
                throw new RuntimeException("New password and confirm password do not match");
            }

            userService.changePassword(authenticatedUser.getUserId(), currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> toUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getUserId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone() == null ? "" : user.getPhone());
        response.put("avatarUrl", user.getAvatarUrl() == null ? "" : user.getAvatarUrl());
        response.put("addressLine1", user.getAddressLine1() == null ? "" : user.getAddressLine1());
        response.put("addressLine2", user.getAddressLine2() == null ? "" : user.getAddressLine2());
        response.put("city", user.getCity() == null ? "" : user.getCity());
        response.put("state", user.getState() == null ? "" : user.getState());
        response.put("postalCode", user.getPostalCode() == null ? "" : user.getPostalCode());
        response.put("country", user.getCountry() == null ? "" : user.getCountry());
        response.put("role", user.getRole());
        response.put("status", user.getStatus());
        response.put("blocked", user.getBlocked());
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());
        response.put("lastLoginAt", user.getLastLoginAt());
        return response;
    }
}
