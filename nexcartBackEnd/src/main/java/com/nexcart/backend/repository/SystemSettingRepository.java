package com.nexcart.backend.repository;

import com.nexcart.backend.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Integer> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
}
