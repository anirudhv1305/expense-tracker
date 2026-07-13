package com.expensetracker.settings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SettingsRepository extends JpaRepository<Settings, UUID> {
    Optional<Settings> findByUserId(UUID userId);
}
