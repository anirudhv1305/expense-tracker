package com.expensetracker.controller;

import com.expensetracker.dto.Responses;
import com.expensetracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping
    public Responses.DashboardResponse dashboard() {
        return dashboardService.currentDashboard();
    }

    @GetMapping("/history")
    public List<Responses.MonthSummary> history() {
        return dashboardService.history();
    }
}
