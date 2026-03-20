package com.nexcart.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String frontendBaseUrl;
    private final String resetPath;
    private final String templatePath;
    private final EmailTemplateService templateService;

    @Autowired
    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${app.mail.from:noreply@nexcart.local}") String fromAddress,
            @Value("${app.frontend.base-url:http://localhost:5174}") String frontendBaseUrl,
            @Value("${app.frontend.reset-path:/reset-password}") String resetPath,
            @Value("${app.mail.reset-template:templates/reset-password.html}") String templatePath,
            EmailTemplateService templateService) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendBaseUrl = frontendBaseUrl;
        this.resetPath = resetPath;
        this.templatePath = templatePath;
        this.templateService = templateService;
    }

    public String buildResetLink(String token) {
        String base = frontendBaseUrl.endsWith("/") ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) : frontendBaseUrl;
        String path = resetPath.startsWith("/") ? resetPath : "/" + resetPath;
        return base + path + "?token=" + token;
    }

    public void sendPasswordReset(String to, String resetLink) {
        if (to == null || to.isBlank()) {
            logger.warn("Skipping password reset email because recipient is empty.");
            return;
        }
        if (mailSender == null) {
            logger.warn("JavaMailSender not configured. Reset link: {}", resetLink);
            return;
        }
        String subject = "NexCart password reset";
        String htmlBody = buildHtml(resetLink);
        String textBody = "You requested a password reset. Use the link below to set a new password:\n\n" + resetLink +
                "
\nIf you did not request this, you can ignore this email.";

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(to);
            helper.setFrom(fromAddress);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            mailSender.send(mimeMessage);
        } catch (MessagingException ex) {
            logger.warn("Failed to send HTML email, falling back to text email: {}", ex.getMessage());
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(to);
                message.setFrom(fromAddress);
                message.setSubject(subject);
                message.setText(textBody);
                mailSender.send(message);
            } catch (Exception fallbackEx) {
                logger.warn("Failed to send reset email: {}", fallbackEx.getMessage());
            }
        } catch (Exception ex) {
            logger.warn("Failed to send reset email: {}", ex.getMessage());
        }
    }

    private String buildHtml(String resetLink) {
        try {
            String dbTemplate = templateService.getResetTemplate();
            if (dbTemplate != null && !dbTemplate.isBlank()) {
                return dbTemplate.replace("{{resetLink}}", resetLink);
            }
            ClassPathResource resource = new ClassPathResource(templatePath);
            if (resource.exists()) {
                String template = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
                return template.replace("{{resetLink}}", resetLink);
            }
        } catch (Exception ex) {
            logger.warn("Unable to load reset email template: {}", ex.getMessage());
        }
        return "<p>You requested a password reset.</p><p><a href=\"" + resetLink + "\">Reset your password</a></p>";
    }
}
