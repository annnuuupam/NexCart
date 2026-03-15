package com.nexcart.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
public class SystemSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 120)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getSettingKey() { return settingKey; }
    public void setSettingKey(String settingKey) { this.settingKey = settingKey; }
    public String getSettingValue() { return settingValue; }
    public void setSettingValue(String settingValue) { this.settingValue = settingValue; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
