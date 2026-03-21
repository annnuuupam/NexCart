package com.nexcart.backend.service;

import com.nexcart.backend.entity.SystemSetting;
import com.nexcart.backend.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SystemSettingsService {

    private final SystemSettingRepository repository;
    @Value("${razorpay.key_id:}")
    private String razorpayKeyId;

    private final Map<String, String> defaults = Map.ofEntries(
            Map.entry("free_shipping_threshold", "999"),
            Map.entry("domestic_shipping_charge", "79"),
            Map.entry("international_shipping_charge", "499"),
            Map.entry("dispatch_sla_hours", "24"),
            Map.entry("gst_percentage", "18"),
            Map.entry("tax_enabled", "true"),
            Map.entry("stripe_enabled", "false"),
            Map.entry("razorpay_enabled", "true"),
            Map.entry("paypal_enabled", "false"),
            Map.entry("cod_enabled", "true"),
            Map.entry("store_name", "NexCart"),
            Map.entry("store_email", "support@nexcart.com"),
            Map.entry("store_phone", ""),
            Map.entry("store_logo", ""),
            Map.entry("session_timeout_min", "60"),
            Map.entry("enable_2fa", "false")
    );

    private final Map<String, String> cache = new ConcurrentHashMap<>();
    private volatile long lastLoaded = 0L;
    private static final long CACHE_TTL_MS = 30_000L;

    public SystemSettingsService(SystemSettingRepository repository) {
        this.repository = repository;
    }

    public Map<String, String> getSettings() {
        long now = System.currentTimeMillis();
        if (!cache.isEmpty() && now - lastLoaded < CACHE_TTL_MS) {
            return new HashMap<>(cache);
        }
        synchronized (this) {
            if (!cache.isEmpty() && now - lastLoaded < CACHE_TTL_MS) {
                return new HashMap<>(cache);
            }
            cache.clear();
            repository.findAll().forEach(setting -> cache.put(setting.getSettingKey(), setting.getSettingValue()));
            defaults.forEach(cache::putIfAbsent);
            lastLoaded = System.currentTimeMillis();
            return new HashMap<>(cache);
        }
    }

    @Transactional
    public void updateSettings(Map<String, String> updates) {
        if (updates == null || updates.isEmpty()) return;
        updates.forEach((key, value) -> {
            if (key == null || key.isBlank()) return;
            String safeValue = value == null ? "" : value.trim();
            SystemSetting setting = repository.findBySettingKey(key)
                    .orElseGet(SystemSetting::new);
            setting.setSettingKey(key);
            setting.setSettingValue(safeValue);
            repository.save(setting);
        });

        cache.clear();
        lastLoaded = 0L;
        getSettings();
    }

    public Map<String, Object> getGroupedSettings() {
        Map<String, String> settings = getSettings();

        Map<String, Object> store = new HashMap<>();
        store.put("storeName", settings.get("store_name"));
        store.put("email", settings.get("store_email"));
        store.put("phone", settings.get("store_phone"));
        store.put("logo", settings.get("store_logo"));

        Map<String, Object> payment = new HashMap<>();
        payment.put("stripe", getBoolean(settings, "stripe_enabled"));
        payment.put("razorpay", getBoolean(settings, "razorpay_enabled"));
        payment.put("paypal", getBoolean(settings, "paypal_enabled"));
        payment.put("cod", getBoolean(settings, "cod_enabled"));
        if (razorpayKeyId != null && !razorpayKeyId.isBlank()) {
            payment.put("razorpayKeyId", razorpayKeyId);
        }

        Map<String, Object> shipping = new HashMap<>();
        shipping.put("freeShippingMin", getBigDecimal(settings, "free_shipping_threshold"));
        shipping.put("domesticCharge", getBigDecimal(settings, "domestic_shipping_charge"));
        shipping.put("internationalCharge", getBigDecimal(settings, "international_shipping_charge"));
        shipping.put("dispatchSlaHours", getBigDecimal(settings, "dispatch_sla_hours"));

        Map<String, Object> tax = new HashMap<>();
        tax.put("gstPercentage", getBigDecimal(settings, "gst_percentage"));
        tax.put("taxEnabled", getBoolean(settings, "tax_enabled"));

        Map<String, Object> security = new HashMap<>();
        security.put("sessionTimeoutMin", getBigDecimal(settings, "session_timeout_min"));
        security.put("enable2FA", getBoolean(settings, "enable_2fa"));

        Map<String, Object> response = new HashMap<>();
        response.put("store", store);
        response.put("payment", payment);
        response.put("shipping", shipping);
        response.put("tax", tax);
        response.put("security", security);

        return response;
    }

    public Map<String, Object> getPublicSettings() {
        Map<String, Object> grouped = getGroupedSettings();
        Map<String, Object> response = new HashMap<>();
        response.put("shipping", grouped.get("shipping"));
        response.put("tax", grouped.get("tax"));
        response.put("payment", grouped.get("payment"));
        response.put("store", grouped.get("store"));
        return response;
    }

    public Map<String, Object> getPaymentMethods() {
        Map<String, String> settings = getSettings();
        Map<String, Object> response = new HashMap<>();
        response.put("stripe", getBoolean(settings, "stripe_enabled"));
        response.put("razorpay", getBoolean(settings, "razorpay_enabled"));
        response.put("paypal", getBoolean(settings, "paypal_enabled"));
        response.put("cod", getBoolean(settings, "cod_enabled"));
        return response;
    }

    public BigDecimal getBigDecimalSetting(String key) {
        return getBigDecimal(getSettings(), key);
    }

    public boolean getBooleanSetting(String key) {
        return getBoolean(getSettings(), key);
    }

    private BigDecimal getBigDecimal(Map<String, String> settings, String key) {
        try {
            return new BigDecimal(settings.getOrDefault(key, defaults.getOrDefault(key, "0")));
        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }

    private boolean getBoolean(Map<String, String> settings, String key) {
        return Boolean.parseBoolean(settings.getOrDefault(key, defaults.getOrDefault(key, "false")));
    }
}

