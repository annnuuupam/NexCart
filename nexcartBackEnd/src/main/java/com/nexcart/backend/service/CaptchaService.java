package com.nexcart.backend.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class CaptchaService {

    private static final long TTL_MS = 5 * 60 * 1000;
    private final Map<String, CaptchaEntry> store = new ConcurrentHashMap<>();

    public CaptchaChallenge generate() {
        int a = 2 + (int) (Math.random() * 8);
        int b = 1 + (int) (Math.random() * 9);
        String id = UUID.randomUUID().toString();
        store.put(id, new CaptchaEntry(a + b, Instant.now().toEpochMilli()));
        return new CaptchaChallenge(id, "What is " + a + " + " + b + " ?");
    }

    public boolean verify(String id, String answer) {
        if (id == null || id.isBlank()) return false;
        CaptchaEntry entry = store.remove(id);
        if (entry == null) return false;
        if (Instant.now().toEpochMilli() - entry.createdAtMs > TTL_MS) return false;
        try {
            return Integer.parseInt(answer.trim()) == entry.answer;
        } catch (Exception ex) {
            return false;
        }
    }

    private static class CaptchaEntry {
        final int answer;
        final long createdAtMs;
        CaptchaEntry(int answer, long createdAtMs) {
            this.answer = answer;
            this.createdAtMs = createdAtMs;
        }
    }

    public static class CaptchaChallenge {
        private final String captchaId;
        private final String question;

        public CaptchaChallenge(String captchaId, String question) {
            this.captchaId = captchaId;
            this.question = question;
        }

        public String getCaptchaId() { return captchaId; }
        public String getQuestion() { return question; }
    }
}
