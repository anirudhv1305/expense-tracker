package com.expensetracker.service;

import com.expensetracker.category.CategoryRepository;
import com.expensetracker.dto.Requests;
import com.expensetracker.exception.ApiException;
import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.source.CreditSourceRepository;
import com.expensetracker.transaction.Transaction;
import com.expensetracker.transaction.TransactionRepository;
import com.expensetracker.transaction.TransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final MonthlyCycleService monthlyCycleService;
    private final TransactionRepository transactionRepository;
    private final MonthlyRecordRepository monthlyRecordRepository;
    private final CategoryRepository categoryRepository;
    private final CreditSourceRepository creditSourceRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public Transaction create(Requests.TransactionRequest request) {
        var user = currentUserService.currentUser();
        var month = monthlyCycleService.ensureCurrentMonth(user);
        if (request.date().isBefore(month.getStartDate()) || request.date().isAfter(month.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Transaction date must be inside the current tracking month");
        }

        var tx = new Transaction();
        tx.setUser(user);
        tx.setMonthlyRecord(month);
        tx.setBalanceAfterTransaction(month.getClosingBalance());
        applyRequest(tx, request, LocalTime.now());

        var saved = transactionRepository.save(tx);
        recalculateMonth(month.getId());
        return transactionRepository.findById(saved.getId()).orElseThrow();
    }

    @Transactional
    public Transaction update(UUID transactionId, Requests.TransactionRequest request) {
        var user = currentUserService.currentUser();
        var existing = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction not found"));
        if (!existing.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot edit another user's transaction");
        }
        var month = existing.getMonthlyRecord();
        if (request.date().isBefore(month.getStartDate()) || request.date().isAfter(month.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Transaction date must stay inside its tracking month");
        }
        applyRequest(existing, request, existing.getOccurredAt().toLocalTime());
        var saved = transactionRepository.save(existing);
        recalculateMonth(month.getId());
        return transactionRepository.findById(saved.getId()).orElseThrow();
    }

    @Transactional
    public void delete(UUID transactionId) {
        var user = currentUserService.currentUser();
        var existing = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction not found"));
        if (!existing.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot delete another user's transaction");
        }
        var monthId = existing.getMonthlyRecord().getId();
        transactionRepository.delete(existing);
        transactionRepository.flush();
        recalculateMonth(monthId);
    }

    @Transactional
    public void recalculateMonth(UUID monthId) {
        var user = currentUserService.currentUser();
        var month = monthlyRecordRepository.findByIdAndUserId(monthId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found"));
        var running = month.getOpeningBalance();
        var credits = BigDecimal.ZERO;
        var debits = BigDecimal.ZERO;
        var txs = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month);

        for (var tx : txs) {
            if (tx.getType() == TransactionType.CREDIT) {
                running = running.add(tx.getAmount());
                credits = credits.add(tx.getAmount());
            } else {
                running = running.subtract(tx.getAmount());
                debits = debits.add(tx.getAmount());
            }
            tx.setBalanceAfterTransaction(running);
        }

        month.setTotalCredits(credits);
        month.setTotalDebits(debits);
        month.setClosingBalance(running);
        month.setTransactionCount(txs.size());
        monthlyRecordRepository.save(month);
    }

    private void applyRequest(Transaction tx, Requests.TransactionRequest request, LocalTime time) {
        tx.setType(request.type());
        tx.setAmount(request.amount());
        tx.setOccurredAt(request.date().atTime(time));
        tx.setDescription(request.description().trim());
        tx.setCategory(null);
        tx.setCreditSource(null);
        tx.setSubCategory(null);

        if (request.type() == TransactionType.DEBIT) {
            if (request.categoryId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Debit transactions require a category");
            }
            tx.setCategory(categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found")));
            if ("Outings".equalsIgnoreCase(tx.getCategory().getName())) {
                if (request.subCategory() == null || request.subCategory().isBlank()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Outings transactions require a sub category");
                }
                tx.setSubCategory(request.subCategory());
            }
        } else {
            if (request.creditSourceId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Credit transactions require a source");
            }
            tx.setCreditSource(creditSourceRepository.findById(request.creditSourceId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Credit source not found")));
        }
    }
}
