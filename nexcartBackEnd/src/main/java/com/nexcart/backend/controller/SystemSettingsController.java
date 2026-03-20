package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Role;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.SystemSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app",
                                "https://nex-cart-6dxfirgrk-annnuuupams-projects.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/settings")
public class SystemSettingsController {

    private final SystemSettingsService systemSettingsService;

    public SystemSettingsController(SystemSettingsService systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(systemSettingsService.getPublicSettings());
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<Map<String, Object>> getPaymentMethods() {
        return ResponseEntity.ok(systemSettingsService.getPaymentMethods());
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        User user = (User) request.getAttribute("authenticatedUser");
        if (user == null || user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        Map<String, String> updates = new HashMap<>();
        if (payload != null) {
            payload.forEach((key, value) -> {
                if (value != null) updates.put(String.valueOf(key), String.valueOf(value));
            });
        }
        systemSettingsService.updateSettings(updates);
        return ResponseEntity.ok(Map.of("message", "Settings updated"));
    }
}
