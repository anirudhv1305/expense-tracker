package com.expensetracker.service;

import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.user.AppUserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.expensetracker.settings.Settings;
import com.expensetracker.settings.SettingsRepository;
import com.expensetracker.transaction.Transaction;
import com.expensetracker.transaction.TransactionRepository;
import com.expensetracker.transaction.TransactionType;
import com.expensetracker.user.AppUser;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MonthlyCycleServiceTest {
    @Test
    void editingOpeningBalanceRecalculatesTheMonthAndExistingTransactions() {
        var settingsRepository = mock(SettingsRepository.class);
        var monthRepository = mock(MonthlyRecordRepository.class);
        var userRepository = mock(AppUserRepository.class);
        var transactionRepository = mock(TransactionRepository.class);
        var user = new AppUser(); user.setId(UUID.randomUUID());
        var today = LocalDate.now();
        var month = new MonthlyRecord(); month.setUser(user); month.setYear(today.getYear()); month.setMonth(today.getMonthValue());
        month.setStartDate(today.withDayOfMonth(1)); month.setEndDate(today.withDayOfMonth(today.lengthOfMonth()));
        month.setOpeningBalance(new BigDecimal("100")); month.setClosingBalance(new BigDecimal("100"));
        var settings = new Settings(); settings.setUser(user); settings.setSetupComplete(true); settings.setCurrentMonth(month);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new UserPrincipal(user.getId(), "Test", "test@example.com", "pw"), "pw", List.of()));
        when(settingsRepository.findByUserId(user.getId())).thenReturn(Optional.of(settings));
        when(monthRepository.save(any(MonthlyRecord.class))).thenReturn(month);
        var credit = new Transaction(); credit.setType(TransactionType.CREDIT); credit.setAmount(new BigDecimal("50"));
        var debit = new Transaction(); debit.setType(TransactionType.DEBIT); debit.setAmount(new BigDecimal("20"));
        when(transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month)).thenReturn(List.of(credit, debit));

        var service = new MonthlyCycleService(settingsRepository, monthRepository, new CurrentUserService(userRepository), transactionRepository);
        var updated = service.updateOpeningBalance(new BigDecimal("1000"));

        assertEquals(new BigDecimal("1000"), updated.getOpeningBalance());
        assertEquals(new BigDecimal("50"), updated.getTotalCredits());
        assertEquals(new BigDecimal("20"), updated.getTotalDebits());
        assertEquals(new BigDecimal("1030"), updated.getClosingBalance());
        assertEquals(new BigDecimal("1050"), credit.getBalanceAfterTransaction());
        assertEquals(new BigDecimal("1030"), debit.getBalanceAfterTransaction());
        assertSame(month, settings.getCurrentMonth());
        verify(monthRepository).save(month);
        SecurityContextHolder.clearContext();
    }
}
