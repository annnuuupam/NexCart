package com.nexcart.backend.service;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import com.nexcart.backend.entity.SystemSetting;

@Service
public class EmailTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(EmailTemplateService.class);
    private final SystemSettingsService systemSettingsService;

    public EmailTemplateService(SystemSettingsService systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }

    public String getResetTemplate() {
        String fromDb = systemSettingsService.getSettings().get("email_reset_template");
        if (fromDb != null && !fromDb.isBlank()) return fromDb;

        try {
            ClassPathResource resource = new ClassPathResource("templates/reset-password.html");
            if (resource.exists()) {
                return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            }
        } catch (Exception ex) {
            logger.warn("Unable to load default email template: {}", ex.getMessage());
        }
        return "";
    }

    public String updateResetTemplate(String template) {
        String safe = template == null ? "" : template;
        systemSettingsService.updateSettings(java.util.Map.of("email_reset_template", safe));
        return safe;
    }
}
