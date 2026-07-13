package com.expensetracker.dto;

import com.expensetracker.transaction.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public final class Requests {
    private Requests() {}

    public record SetupRequest(
            @NotNull @DecimalMin(value = "0.00", inclusive = true) BigDecimal initialBalance
    ) {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 8, max = 120) String password,
            @NotBlank String confirmPassword
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record TransactionRequest(
            @NotNull TransactionType type,
            @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
            @NotNull LocalDate date,
            @NotBlank @Size(max = 180) String description,
            UUID categoryId,
            UUID creditSourceId,
            @Pattern(regexp = "Friend|Girlfriend", message = "Sub category must be Friend or Girlfriend")
            String subCategory
    ) {}

    public record NoteRequest(@Size(max = 5000) String content) {}
}
