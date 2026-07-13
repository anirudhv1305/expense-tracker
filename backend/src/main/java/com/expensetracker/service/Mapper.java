package com.expensetracker.service;

import com.expensetracker.dto.Responses;
import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.transaction.Transaction;

import java.math.BigDecimal;

public final class Mapper {
    private Mapper() {}

    public static Responses.TransactionResponse transaction(Transaction tx) {
        return new Responses.TransactionResponse(
                tx.getId(),
                tx.getType(),
                tx.getCategory() == null ? null : tx.getCategory().getName(),
                tx.getSubCategory(),
                tx.getCreditSource() == null ? null : tx.getCreditSource().getName(),
                tx.getAmount(),
                tx.getOccurredAt(),
                tx.getDescription(),
                tx.getBalanceAfterTransaction()
        );
    }

    public static Responses.MonthSummary month(MonthlyRecord month) {
        return new Responses.MonthSummary(
                month.getId(),
                month.getYear(),
                month.getMonth(),
                month.getStartDate(),
                month.getEndDate(),
                month.getOpeningBalance(),
                month.getTotalCredits(),
                month.getTotalDebits(),
                month.getClosingBalance(),
                month.getTotalCredits().subtract(month.getTotalDebits()),
                month.getTransactionCount()
        );
    }

    public static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
