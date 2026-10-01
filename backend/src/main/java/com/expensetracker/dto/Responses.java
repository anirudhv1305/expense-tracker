package com.expensetracker.dto;

import com.expensetracker.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class Responses {
    private Responses() {}

    public record SetupStatus(boolean setupComplete) {}

    public record LookupItem(UUID id, String name) {}
    public record SubCategoryItem(UUID id, String name, boolean active) {}
    public record CategoryItem(UUID id, String name, boolean active, List<SubCategoryItem> subCategories) {}

    public record TransactionResponse(
            UUID id,
            TransactionType type,
            String category,
            String subCategory,
            String creditSource,
            BigDecimal amount,
            LocalDateTime occurredAt,
            String description,
            BigDecimal balanceAfterTransaction
    ) {}

    public record CategoryTotal(UUID id, String name, BigDecimal total, BigDecimal percentage) {}

    public record SubCategoryTotal(String name, String category, BigDecimal total, List<TransactionResponse> transactions) {}
    public record CategoryChange(UUID id, String name, BigDecimal percentage) {}

    public record SourceTotal(UUID id, String name, BigDecimal total) {}

    public record DailyTotal(LocalDate date, BigDecimal amount) {}

    public record MonthSummary(
            UUID id,
            int year,
            int month,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal openingBalance,
            BigDecimal totalCredits,
            BigDecimal totalDebits,
            BigDecimal closingBalance,
            BigDecimal savings,
            int transactionCount
    ) {}

    public record Insights(
            TransactionResponse largestExpense,
            String mostUsedCategory,
            LocalDate highestSpendingDay,
            BigDecimal averageDailySpending,
            BigDecimal averageTransactionValue
    ) {}

    public record DashboardResponse(
            MonthSummary month,
            BigDecimal currentBankBalance,
            List<CategoryTotal> categoryTotals,
            List<SourceTotal> sourceTotals,
            List<DailyTotal> dailySpending,
            List<TransactionResponse> recentTransactions
    ) {}

    public record MonthlyDashboardResponse(
            MonthSummary month,
            List<CategoryTotal> categoryTotals,
            List<SourceTotal> sourceTotals,
            List<DailyTotal> dailySpending,
            List<TransactionResponse> transactions,
            Insights insights,
            String notes,
            MonthComparison comparison,
            List<SubCategoryTotal> subCategoryTotals
    ) {}

    public record MonthComparison(String label, BigDecimal incomePct, BigDecimal expensesPct, BigDecimal savingsPct,
                                  List<CategoryChange> categoryChanges) {}

    public record AuthUser(UUID id, String name, String email) {}

    public record AuthResponse(String token, AuthUser user) {}
}
