package com.nexcart.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexcart.backend.dto.LoginRequest;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.AuthService;
import com.nexcart.backend.service.CaptchaService;
import com.nexcart.backend.service.EmailService;
import com.nexcart.backend.service.PasswordResetAuditService;
import com.nexcart.backend.service.PasswordResetRateLimiter;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;
    private final PasswordResetAuditService auditService;
    private final PasswordResetRateLimiter rateLimiter;
    private final CaptchaService captchaService;

    public AuthController(AuthService authService, EmailService emailService, PasswordResetAuditService auditService, PasswordResetRateLimiter rateLimiter, CaptchaService captchaService) {
        this.authService = authService;
        this.emailService = emailService;
        this.auditService = auditService;
        this.rateLimiter = rateLimiter;
        this.captchaService = captchaService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request, HttpServletResponse response) {
        try {
            User user = authService.authenticate(loginRequest.getUsername(), loginRequest.getPassword());
            String token = authService.generateToken(user);

            ResponseCookie cookie = buildAuthCookie(request, token, 3600);
            response.addHeader("Set-Cookie", cookie.toString());

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

            ResponseCookie cookie = buildAuthCookie(request, "", 0);
            response.addHeader("Set-Cookie", cookie.toString());

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

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String identifier = payload.getOrDefault("identifier", "").trim();
        String captchaId = payload.getOrDefault("captchaId", "");
        String captchaAnswer = payload.getOrDefault("captchaAnswer", "");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "If an account exists, a reset link will be sent.");
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        if (!captchaService.verify(captchaId, captchaAnswer)) {
            auditService.log("forgot_password_captcha_failed", null, identifier, ip, userAgent);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Captcha verification failed"));
        }

        if (!rateLimiter.allow(ip, identifier)) {
            auditService.log("forgot_password_rate_limited", null, identifier, ip, userAgent);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", "Too many requests. Try again later."));
        }

        authService.findByIdentifier(identifier).ifPresent(user -> {
            try {
                String token = authService.createPasswordResetToken(user);
                String resetLink = emailService.buildResetLink(token);
                emailService.sendPasswordReset(user.getEmail(), resetLink);
                auditService.log("forgot_password_sent", user.getUserId(), identifier, ip, userAgent);

                String origin = request.getHeader("Origin");
                if (origin != null && origin.contains("localhost")) {
                    response.put("resetToken", token);
                    response.put("resetLink", resetLink);
                }
            } catch (Exception ex) {
                auditService.log("forgot_password_failed", user.getUserId(), identifier, ip, userAgent);
            }
        });

        return ResponseEntity.ok(response);
    }

    @GetMapping("/captcha")
    public ResponseEntity<?> getCaptcha() {
        CaptchaService.CaptchaChallenge challenge = captchaService.generate();
        return ResponseEntity.ok(Map.of(
                "captchaId", challenge.getCaptchaId(),
                "question", challenge.getQuestion()
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        try {
            String token = payload.getOrDefault("token", "");
            String newPassword = payload.getOrDefault("newPassword", "");
            String confirmPassword = payload.getOrDefault("confirmPassword", "");
            authService.resetPassword(token, newPassword, confirmPassword);
            auditService.log("reset_password_success", null, null, ip, userAgent);
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        } catch (RuntimeException ex) {
            auditService.log("reset_password_failed", null, null, ip, userAgent);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }

    private ResponseCookie buildAuthCookie(HttpServletRequest request, String token, int maxAgeSeconds) {
        String origin = request.getHeader("Origin");
        boolean isLocal = origin != null && origin.contains("localhost");
        boolean secure = !isLocal;
        String sameSite = secure ? "None" : "Lax";

        return ResponseCookie.from("authToken", token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite(sameSite)
                .build();
    }
}
