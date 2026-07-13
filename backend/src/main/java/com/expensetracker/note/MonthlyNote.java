package com.expensetracker.note;

import com.expensetracker.common.BaseEntity;
import com.expensetracker.month.MonthlyRecord;
import com.expensetracker.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "monthly_notes")
public class MonthlyNote extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "monthly_record_id", nullable = false, unique = true)
    private MonthlyRecord monthlyRecord;

    @Column(nullable = false, columnDefinition = "text")
    private String content = "";
}
