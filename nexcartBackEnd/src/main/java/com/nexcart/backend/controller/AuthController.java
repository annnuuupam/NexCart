package com.nexcart.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexcart.backend.dto.LoginRequest;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176"}, allowCredentials = "true")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            User user = authService.authenticate(loginRequest.getUsername(), loginRequest.getPassword());
            String token = authService.generateToken(user);

            Cookie cookie = new Cookie("authToken", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false);
            cookie.setPath("/");
            cookie.setMaxAge(3600);
            response.addCookie(cookie);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("message", "Login successful");
            responseBody.put("role", user.getRole().name());
            responseBody.put("username", user.getUsername());
            responseBody.put("userId", user.getUserId());
            return ResponseEntity.ok(responseBody);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            User user = (User) request.getAttribute("authenticatedUser");
            if (user != null) {
                authService.logout(user);
            }

            Cookie cookie = new Cookie("authToken", "");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(0);
            cookie.setPath("/");
            response.addCookie(cookie);

            return ResponseEntity.ok(Map.of("message", "Logout successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Logout failed"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        User user = (User) request.getAttribute("authenticatedUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        return ResponseEntity.ok(Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "role", user.getRole().name(),
                "status", user.getStatus(),
                "blocked", user.getBlocked(),
                "lastLoginAt", user.getLastLoginAt()
        ));
    }
}
