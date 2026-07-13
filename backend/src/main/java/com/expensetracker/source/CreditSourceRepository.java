package com.expensetracker.source;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CreditSourceRepository extends JpaRepository<CreditSource, UUID> {
    Optional<CreditSource> findByNameIgnoreCase(String name);
}
