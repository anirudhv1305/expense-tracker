package com.expensetracker.service;

import com.expensetracker.category.Category;
import com.expensetracker.category.CategoryRepository;
import com.expensetracker.dto.Responses;
import com.expensetracker.exception.ApiException;
import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.note.MonthlyNote;
import com.expensetracker.note.MonthlyNoteRepository;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.source.CreditSource;
import com.expensetracker.source.CreditSourceRepository;
import com.expensetracker.transaction.Transaction;
import com.expensetracker.transaction.TransactionRepository;
import com.expensetracker.transaction.TransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final MonthlyCycleService monthlyCycleService;
    private final MonthlyRecordRepository monthlyRecordRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final CreditSourceRepository creditSourceRepository;
    private final MonthlyNoteRepository monthlyNoteRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public Responses.DashboardResponse currentDashboard() {
        var user = currentUserService.currentUser();
        var month = monthlyCycleService.ensureCurrentMonth(user);
        return new Responses.DashboardResponse(
                Mapper.month(month),
                month.getClosingBalance(),
                categoryTotals(month),
                sourceTotals(month),
                dailyTotals(month),
                transactionRepository.findTop8ByMonthlyRecordAndUserIdOrderByOccurredAtDescCreatedAtDesc(month, user.getId()).stream()
                        .map(Mapper::transaction)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public Responses.MonthlyDashboardResponse monthlyDashboard(UUID monthId) {
        var user = currentUserService.currentUser();
        var month = monthlyRecordRepository.findByIdAndUserId(monthId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found"));
        var txs = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month);
        var notes = monthlyNoteRepository.findByMonthlyRecordAndUserId(month, user.getId()).map(MonthlyNote::getContent).orElse("");
        return new Responses.MonthlyDashboardResponse(
                Mapper.month(month),
                categoryTotals(month),
                sourceTotals(month),
                dailyTotals(month),
                txs.stream().map(Mapper::transaction).toList(),
                insights(month, txs),
                notes,
                comparison(month),
                outingSubCategories(txs)
        );
    }

    public List<Responses.MonthSummary> history() {
        var user = currentUserService.currentUser();
        return monthlyRecordRepository.findByUserIdOrderByYearDescMonthDesc(user.getId()).stream().map(Mapper::month).toList();
    }

    public List<Responses.LookupItem> categories() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(Category::getDisplayOrder))
                .map(c -> new Responses.LookupItem(c.getId(), c.getName()))
                .toList();
    }

    public List<Responses.LookupItem> creditSources() {
        return creditSourceRepository.findAll().stream()
                .sorted(Comparator.comparing(CreditSource::getDisplayOrder))
                .map(c -> new Responses.LookupItem(c.getId(), c.getName()))
                .toList();
    }

    private List<Responses.CategoryTotal> categoryTotals(MonthlyRecord month) {
        var txs = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month).stream()
                .filter(tx -> tx.getType() == TransactionType.DEBIT)
                .toList();
        var totals = txs.stream().collect(Collectors.groupingBy(tx -> tx.getCategory().getId(),
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));
        var totalDebits = month.getTotalDebits();
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(Category::getDisplayOrder))
                .map(category -> {
                    var total = totals.getOrDefault(category.getId(), BigDecimal.ZERO);
                    return new Responses.CategoryTotal(category.getId(), category.getName(), total, pct(total, totalDebits));
                })
                .toList();
    }

    private List<Responses.SourceTotal> sourceTotals(MonthlyRecord month) {
        var totals = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month).stream()
                .filter(tx -> tx.getType() == TransactionType.CREDIT)
                .collect(Collectors.groupingBy(tx -> tx.getCreditSource().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));
        return creditSourceRepository.findAll().stream()
                .sorted(Comparator.comparing(CreditSource::getDisplayOrder))
                .map(source -> new Responses.SourceTotal(source.getId(), source.getName(), totals.getOrDefault(source.getId(), BigDecimal.ZERO)))
                .toList();
    }

    private List<Responses.DailyTotal> dailyTotals(MonthlyRecord month) {
        var totals = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month).stream()
                .filter(tx -> tx.getType() == TransactionType.DEBIT)
                .collect(Collectors.groupingBy(tx -> tx.getOccurredAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)));
        return month.getStartDate().datesUntil(month.getEndDate().plusDays(1))
                .map(date -> new Responses.DailyTotal(date, totals.getOrDefault(date, BigDecimal.ZERO)))
                .toList();
    }

    private Responses.Insights insights(MonthlyRecord month, List<Transaction> txs) {
        var debits = txs.stream().filter(tx -> tx.getType() == TransactionType.DEBIT).toList();
        var largest = debits.stream().max(Comparator.comparing(Transaction::getAmount)).map(Mapper::transaction).orElse(null);
        var mostUsed = debits.stream()
                .collect(Collectors.groupingBy(tx -> tx.getCategory().getName(), Collectors.counting()))
                .entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("No expenses yet");
        var highestDay = dailyTotals(month).stream()
                .max(Comparator.comparing(Responses.DailyTotal::amount))
                .map(Responses.DailyTotal::date).orElse(month.getStartDate());
        var days = YearMonth.of(month.getYear(), month.getMonth()).lengthOfMonth();
        var avgDaily = month.getTotalDebits().divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
        var avgTx = txs.isEmpty() ? BigDecimal.ZERO : month.getTotalDebits().add(month.getTotalCredits())
                .divide(BigDecimal.valueOf(txs.size()), 2, RoundingMode.HALF_UP);
        return new Responses.Insights(largest, mostUsed, highestDay, avgDaily, avgTx);
    }

    private Responses.MonthComparison comparison(MonthlyRecord month) {
        var previous = YearMonth.of(month.getYear(), month.getMonth()).minusMonths(1);
        return monthlyRecordRepository.findByUserIdAndYearAndMonth(month.getUser().getId(), previous.getYear(), previous.getMonthValue())
                .map(prev -> new Responses.MonthComparison(
                        previous.getMonth() + " " + previous.getYear(),
                        delta(month.getTotalCredits(), prev.getTotalCredits()),
                        delta(month.getTotalDebits(), prev.getTotalDebits()),
                        delta(month.getTotalCredits().subtract(month.getTotalDebits()), prev.getTotalCredits().subtract(prev.getTotalDebits())),
                        categoryDelta(month, prev, "Shopping"),
                        categoryDelta(month, prev, "Food"),
                        categoryDelta(month, prev, "Travel")
                ))
                .orElse(new Responses.MonthComparison("No previous month", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    }

    private BigDecimal categoryDelta(MonthlyRecord current, MonthlyRecord previous, String categoryName) {
        var currentTotal = categoryTotals(current).stream().filter(c -> c.name().contains(categoryName)).map(Responses.CategoryTotal::total).findFirst().orElse(BigDecimal.ZERO);
        var previousTotal = categoryTotals(previous).stream().filter(c -> c.name().contains(categoryName)).map(Responses.CategoryTotal::total).findFirst().orElse(BigDecimal.ZERO);
        return delta(currentTotal, previousTotal);
    }

    private BigDecimal pct(BigDecimal amount, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return amount.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal delta(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return current.subtract(previous).multiply(BigDecimal.valueOf(100)).divide(previous, 2, RoundingMode.HALF_UP);
    }

    private List<Responses.SubCategoryTotal> outingSubCategories(List<Transaction> txs) {
        return List.of("Friend", "Girlfriend").stream()
                .map(name -> {
                    var matching = txs.stream()
                            .filter(tx -> tx.getType() == TransactionType.DEBIT)
                            .filter(tx -> tx.getCategory() != null && "Outings".equalsIgnoreCase(tx.getCategory().getName()))
                            .filter(tx -> name.equalsIgnoreCase(tx.getSubCategory()))
                            .toList();
                    var total = matching.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new Responses.SubCategoryTotal(name, total, matching.stream().map(Mapper::transaction).toList());
                })
                .toList();
    }
}
