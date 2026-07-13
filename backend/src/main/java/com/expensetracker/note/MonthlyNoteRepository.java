package com.expensetracker.note;

import com.expensetracker.month.MonthlyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MonthlyNoteRepository extends JpaRepository<MonthlyNote, UUID> {
    Optional<MonthlyNote> findByMonthlyRecord(MonthlyRecord monthlyRecord);
    Optional<MonthlyNote> findByMonthlyRecordAndUserId(MonthlyRecord monthlyRecord, UUID userId);
}
