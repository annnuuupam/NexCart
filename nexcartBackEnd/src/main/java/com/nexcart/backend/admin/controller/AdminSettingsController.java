package com.nexcart.backend.admin.controller;

import com.nexcart.backend.service.SystemSettingsService;
import com.nexcart.backend.service.EmailTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
public class AdminSettingsController {

    private final SystemSettingsService systemSettingsService;
    private final EmailTemplateService emailTemplateService;

    public AdminSettingsController(SystemSettingsService systemSettingsService, EmailTemplateService emailTemplateService) {
        this.systemSettingsService = systemSettingsService;
        this.emailTemplateService = emailTemplateService;
    }

    @GetMapping
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(systemSettingsService.getGroupedSettings());
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> payload) {
        Map<String, String> updates = new HashMap<>();
        Map<String, Object> store = payload == null ? null : (Map<String, Object>) payload.get("store");
        Map<String, Object> payment = payload == null ? null : (Map<String, Object>) payload.get("payment");
        Map<String, Object> shipping = payload == null ? null : (Map<String, Object>) payload.get("shipping");
        Map<String, Object> tax = payload == null ? null : (Map<String, Object>) payload.get("tax");
        Map<String, Object> security = payload == null ? null : (Map<String, Object>) payload.get("security");

        if (store != null) {
            updates.put("store_name", String.valueOf(store.getOrDefault("storeName", "")));
            updates.put("store_email", String.valueOf(store.getOrDefault("email", "")));
            updates.put("store_phone", String.valueOf(store.getOrDefault("phone", "")));
            updates.put("store_logo", String.valueOf(store.getOrDefault("logo", "")));
        }

        if (payment != null) {
            updates.put("stripe_enabled", String.valueOf(payment.getOrDefault("stripe", "false")));
            updates.put("razorpay_enabled", String.valueOf(payment.getOrDefault("razorpay", "true")));
            updates.put("paypal_enabled", String.valueOf(payment.getOrDefault("paypal", "false")));
            updates.put("cod_enabled", String.valueOf(payment.getOrDefault("cod", "true")));
        }

        if (shipping != null) {
            updates.put("free_shipping_threshold", String.valueOf(shipping.getOrDefault("freeShippingMin", "0")));
            updates.put("domestic_shipping_charge", String.valueOf(shipping.getOrDefault("domesticCharge", "0")));
            updates.put("international_shipping_charge", String.valueOf(shipping.getOrDefault("internationalCharge", "0")));
            updates.put("dispatch_sla_hours", String.valueOf(shipping.getOrDefault("dispatchSlaHours", "0")));
        }

        if (tax != null) {
            updates.put("gst_percentage", String.valueOf(tax.getOrDefault("gstPercentage", "0")));
            updates.put("tax_enabled", String.valueOf(tax.getOrDefault("taxEnabled", "true")));
        }

        if (security != null) {
            updates.put("session_timeout_min", String.valueOf(security.getOrDefault("sessionTimeoutMin", "60")));
            updates.put("enable_2fa", String.valueOf(security.getOrDefault("enable2FA", "false")));
        }

        systemSettingsService.updateSettings(updates);
        return ResponseEntity.ok(Map.of("message", "Settings updated"));
    }

    @GetMapping("/email-templates/reset")
    public ResponseEntity<?> getResetTemplate() {
        return ResponseEntity.ok(Map.of("template", emailTemplateService.getResetTemplate()));
    }

    @PutMapping("/email-templates/reset")
    public ResponseEntity<?> updateResetTemplate(@RequestBody Map<String, String> payload) {
        String template = payload == null ? "" : payload.getOrDefault("template", "");
        return ResponseEntity.ok(Map.of("template", emailTemplateService.updateResetTemplate(template)));
    }
}
