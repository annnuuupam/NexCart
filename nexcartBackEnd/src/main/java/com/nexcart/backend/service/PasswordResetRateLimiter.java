package com.nexcart.backend.service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PasswordResetRateLimiter {

    private final int maxPerIp;
    private final int maxPerIdentifier;
    private final long windowMs;

    private final Map<String, Deque<Long>> byIp = new ConcurrentHashMap<>();
    private final Map<String, Deque<Long>> byIdentifier = new ConcurrentHashMap<>();

    public PasswordResetRateLimiter(
            @Value("${app.reset.limit.per-ip:8}") int maxPerIp,
            @Value("${app.reset.limit.per-identifier:5}") int maxPerIdentifier,
            @Value("${app.reset.limit.window-ms:900000}") long windowMs) {
        this.maxPerIp = maxPerIp;
        this.maxPerIdentifier = maxPerIdentifier;
        this.windowMs = windowMs;
    }

    public boolean allow(String ip, String identifier) {
        long now = Instant.now().toEpochMilli();
        boolean ipAllowed = checkAndRecord(byIp, ip, maxPerIp, now);
        boolean identifierAllowed = checkAndRecord(byIdentifier, identifier, maxPerIdentifier, now);
        return ipAllowed && identifierAllowed;
    }

    private boolean checkAndRecord(Map<String, Deque<Long>> store, String key, int max, long now) {
        if (key == null || key.isBlank()) return true;
        Deque<Long> queue = store.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (queue) {
            while (!queue.isEmpty() && now - queue.peekFirst() > windowMs) {
                queue.pollFirst();
            }
            if (queue.size() >= max) {
                return false;
            }
            queue.addLast(now);
            return true;
        }
    }
}
