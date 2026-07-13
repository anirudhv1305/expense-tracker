package com.expensetracker.transaction;

import com.expensetracker.month.MonthlyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    List<Transaction> findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(MonthlyRecord monthlyRecord);
    List<Transaction> findTop8ByMonthlyRecordOrderByOccurredAtDescCreatedAtDesc(MonthlyRecord monthlyRecord);
    List<Transaction> findTop8ByMonthlyRecordAndUserIdOrderByOccurredAtDescCreatedAtDesc(MonthlyRecord monthlyRecord, UUID userId);
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);
    List<Transaction> findByOccurredAtBetweenOrderByOccurredAtAsc(LocalDateTime from, LocalDateTime to);
}
