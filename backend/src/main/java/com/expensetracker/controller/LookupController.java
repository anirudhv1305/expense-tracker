package com.expensetracker.controller;

import com.expensetracker.dto.Responses;
import com.expensetracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lookups")
@RequiredArgsConstructor
public class LookupController {
    private final DashboardService dashboardService;

    @GetMapping("/categories")
    public List<Responses.LookupItem> categories() {
        return dashboardService.categories();
    }

    @GetMapping("/credit-sources")
    public List<Responses.LookupItem> creditSources() {
        return dashboardService.creditSources();
    }
}
