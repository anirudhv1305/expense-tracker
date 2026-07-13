package com.expensetracker.transaction;

import com.expensetracker.category.Category;
import com.expensetracker.common.BaseEntity;
import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.source.CreditSource;
import com.expensetracker.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "transactions")
public class Transaction extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "monthly_record_id")
    private MonthlyRecord monthlyRecord;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_source_id")
    private CreditSource creditSource;

    @Column(name = "sub_category", length = 80)
    private String subCategory;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Column(nullable = false, length = 180)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal balanceAfterTransaction;
}
