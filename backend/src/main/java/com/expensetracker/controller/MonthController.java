package com.expensetracker.controller;

import com.expensetracker.dto.Requests;
import com.expensetracker.dto.Responses;
import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.note.MonthlyNote;
import com.expensetracker.note.MonthlyNoteRepository;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.service.DashboardService;
import com.expensetracker.exception.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@RestController
@RequestMapping("/api/months")
@RequiredArgsConstructor
public class MonthController {
    private final DashboardService dashboardService;
    private final MonthlyRecordRepository monthlyRecordRepository;
    private final MonthlyNoteRepository monthlyNoteRepository;
    private final CurrentUserService currentUserService;

    @GetMapping("/{monthId}")
    public Responses.MonthlyDashboardResponse month(@PathVariable UUID monthId) {
        return dashboardService.monthlyDashboard(monthId);
    }

    @PutMapping("/{monthId}/notes")
    public String notes(@PathVariable UUID monthId, @Valid @RequestBody Requests.NoteRequest request) {
        var user = currentUserService.currentUser();
        var month = monthlyRecordRepository.findByIdAndUserId(monthId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found"));
        var note = monthlyNoteRepository.findByMonthlyRecordAndUserId(month, user.getId()).orElseGet(() -> {
            var n = new MonthlyNote();
            n.setUser(user);
            n.setMonthlyRecord(month);
            return n;
        });
        note.setContent(request.content() == null ? "" : request.content());
        monthlyNoteRepository.save(note);
        return note.getContent();
    }
}
