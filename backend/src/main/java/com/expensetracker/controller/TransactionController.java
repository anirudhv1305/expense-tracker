package com.expensetracker.controller;

import com.expensetracker.dto.Requests;
import com.expensetracker.dto.Responses;
import com.expensetracker.service.Mapper;
import com.expensetracker.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    @PostMapping
    public Responses.TransactionResponse create(@Valid @RequestBody Requests.TransactionRequest request) {
        return Mapper.transaction(transactionService.create(request));
    }

    @PutMapping("/{id}")
    public Responses.TransactionResponse update(@PathVariable UUID id, @Valid @RequestBody Requests.TransactionRequest request) {
        return Mapper.transaction(transactionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        transactionService.delete(id);
    }
}
