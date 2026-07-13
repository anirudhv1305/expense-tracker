package com.expensetracker.controller;

import com.expensetracker.dto.Requests;
import com.expensetracker.dto.Responses;
import com.expensetracker.service.MonthlyCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {
    private final MonthlyCycleService monthlyCycleService;

    @GetMapping("/status")
    public Responses.SetupStatus status() {
        return new Responses.SetupStatus(monthlyCycleService.settings().isSetupComplete());
    }

    @PostMapping("/setup")
    public Responses.MonthSummary setup(@Valid @RequestBody Requests.SetupRequest request) {
        return com.expensetracker.service.Mapper.month(monthlyCycleService.setup(request.initialBalance(), LocalDate.now()));
    }
}
