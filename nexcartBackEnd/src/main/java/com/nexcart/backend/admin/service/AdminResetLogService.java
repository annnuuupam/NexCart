package com.nexcart.backend.admin.service;

import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nexcart.backend.entity.PasswordResetAudit;
import com.nexcart.backend.repository.PasswordResetAuditRepository;

@Service
public class AdminResetLogService {

    private final PasswordResetAuditRepository repository;

    public AdminResetLogService(PasswordResetAuditRepository repository) {
        this.repository = repository;
    }

    public List<PasswordResetAudit> getLogs(String q, String action, LocalDateTime from, LocalDateTime to) {
        String query = q == null ? "" : q.trim().toLowerCase();
        String actionFilter = action == null ? "" : action.trim().toLowerCase();

        return repository.findAll().stream()
                .filter(log -> actionFilter.isEmpty() || String.valueOf(log.getAction()).toLowerCase().contains(actionFilter))
                .filter(log -> {
                    if (from == null || log.getCreatedAt() == null) return true;
                    return !log.getCreatedAt().isBefore(from);
                })
                .filter(log -> {
                    if (to == null || log.getCreatedAt() == null) return true;
                    return !log.getCreatedAt().isAfter(to);
                })
                .filter(log -> {
                    if (query.isEmpty()) return true;
                    String blob = (log.getIdentifier() + " " + log.getUserId() + " " + log.getIpAddress() + " " + log.getUserAgent())
                            .toLowerCase();
                    return blob.contains(query);
                })
                .sorted(Comparator.comparing(PasswordResetAudit::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
    }

    public String toCsv(List<PasswordResetAudit> logs) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,action,userId,identifier,ipAddress,userAgent,createdAt\n");
        for (PasswordResetAudit log : logs) {
            sb.append(safe(log.getId())).append(',')
              .append(safe(log.getAction())).append(',')
              .append(safe(log.getUserId())).append(',')
              .append(safe(log.getIdentifier())).append(',')
              .append(safe(log.getIpAddress())).append(',')
              .append(safe(log.getUserAgent())).append(',')
              .append(safe(log.getCreatedAt())).append('\n');
        }
        return sb.toString();
    }

    private String safe(Object value) {
        if (value == null) return "";
        String text = String.valueOf(value).replace("\"", "\"\"");
        if (text.contains(",") || text.contains("
")) {
            return "\"" + text + "\"";
        }
        return text;
    }
}
