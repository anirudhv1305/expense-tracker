package com.expensetracker.service;

import com.expensetracker.exception.ApiException;
import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.settings.Settings;
import com.expensetracker.settings.SettingsRepository;
import com.expensetracker.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class MonthlyCycleService {
    private final SettingsRepository settingsRepository;
    private final MonthlyRecordRepository monthlyRecordRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public Settings settings() {
        return settings(currentUserService.currentUser());
    }

    @Transactional
    public Settings settings(AppUser user) {
        return settingsRepository.findByUserId(user.getId()).orElseGet(() -> {
            var settings = new Settings();
            settings.setUser(user);
            return settingsRepository.save(settings);
        });
    }

    @Transactional
    public MonthlyRecord setup(BigDecimal initialBalance, LocalDate today) {
        var user = currentUserService.currentUser();
        var settings = settings(user);
        if (settings.isSetupComplete()) {
            throw new ApiException(HttpStatus.CONFLICT, "Setup has already been completed");
        }
        var month = createMonth(user, today, today, initialBalance);
        settings.setInitialBalance(initialBalance);
        settings.setSetupComplete(true);
        settings.setCurrentMonth(month);
        settingsRepository.save(settings);
        return month;
    }

    @Transactional
    public MonthlyRecord ensureCurrentMonth() {
        return ensureCurrentMonth(currentUserService.currentUser());
    }

    @Transactional
    public MonthlyRecord ensureCurrentMonth(AppUser user) {
        var settings = settings(user);
        if (!settings.isSetupComplete()) {
            throw new ApiException(HttpStatus.PRECONDITION_REQUIRED, "Complete first-time setup");
        }
        var today = LocalDate.now();
        var current = settings.getCurrentMonth();
        if (current != null && current.getYear() == today.getYear() && current.getMonth() == today.getMonthValue()) {
            return current;
        }
        var opening = current == null ? settings.getInitialBalance() : current.getClosingBalance();
        var firstOfMonth = today.withDayOfMonth(1);
        var month = monthlyRecordRepository.findByUserIdAndYearAndMonth(user.getId(), today.getYear(), today.getMonthValue())
                .orElseGet(() -> createMonth(user, today, firstOfMonth, opening));
        settings.setCurrentMonth(month);
        settingsRepository.save(settings);
        return month;
    }

    @Scheduled(cron = "0 5 0 1 * *")
    @Transactional
    public void scheduledMonthRollover() {
        for (var settings : settingsRepository.findAll()) {
            if (settings.isSetupComplete()) {
                ensureCurrentMonth(settings.getUser());
            }
        }
    }

    private MonthlyRecord createMonth(AppUser user, LocalDate today, LocalDate startDate, BigDecimal openingBalance) {
        var ym = YearMonth.from(today);
        var month = new MonthlyRecord();
        month.setUser(user);
        month.setYear(ym.getYear());
        month.setMonth(ym.getMonthValue());
        month.setStartDate(startDate);
        month.setEndDate(ym.atEndOfMonth());
        month.setOpeningBalance(openingBalance);
        month.setClosingBalance(openingBalance);
        return monthlyRecordRepository.save(month);
    }
}
