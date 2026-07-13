package com.expensetracker.month;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyRecordRepository extends JpaRepository<MonthlyRecord, UUID> {
    Optional<MonthlyRecord> findByYearAndMonth(Integer year, Integer month);
    Optional<MonthlyRecord> findByUserIdAndYearAndMonth(UUID userId, Integer year, Integer month);
    Optional<MonthlyRecord> findByIdAndUserId(UUID id, UUID userId);
    List<MonthlyRecord> findAllByOrderByYearDescMonthDesc();
    List<MonthlyRecord> findByUserIdOrderByYearDescMonthDesc(UUID userId);
}
