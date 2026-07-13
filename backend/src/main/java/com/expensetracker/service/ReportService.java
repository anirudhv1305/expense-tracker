package com.expensetracker.service;

import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.exception.ApiException;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.transaction.TransactionRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final MonthlyRecordRepository monthlyRecordRepository;
    private final TransactionRepository transactionRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public byte[] csv(UUID monthId) {
        var user = currentUserService.currentUser();
        var month = monthlyRecordRepository.findByIdAndUserId(monthId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found"));
        var txs = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month);
        try {
            var out = new ByteArrayOutputStream();
            var writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));
            writer.writeNext(new String[]{"User", "Date", "Amount", "Category", "Sub Category", "Description", "Balance After Transaction"});
            for (var tx : txs) {
                writer.writeNext(new String[]{
                        tx.getUser().getEmail(),
                        tx.getOccurredAt().toLocalDate().toString(),
                        tx.getAmount().toPlainString(),
                        tx.getCategory() == null ? tx.getCreditSource().getName() : tx.getCategory().getName(),
                        tx.getSubCategory() == null ? "" : tx.getSubCategory(),
                        tx.getDescription(),
                        tx.getBalanceAfterTransaction().toPlainString()
                });
            }
            writer.flush();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate CSV", ex);
        }
    }

    @Transactional(readOnly = true)
    public byte[] excel(UUID monthId) {
        var user = currentUserService.currentUser();
        var month = monthlyRecordRepository.findByIdAndUserId(monthId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found"));
        var txs = transactionRepository.findByMonthlyRecordOrderByOccurredAtAscCreatedAtAsc(month);
        try (var workbook = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Transactions");
            var header = sheet.createRow(0);
            var columns = new String[]{"User", "Date", "Amount", "Category", "Sub Category", "Description", "Balance After Transaction"};
            for (int i = 0; i < columns.length; i++) header.createCell(i).setCellValue(columns[i]);
            for (int r = 0; r < txs.size(); r++) {
                var tx = txs.get(r);
                var row = sheet.createRow(r + 1);
                row.createCell(0).setCellValue(tx.getUser().getEmail());
                row.createCell(1).setCellValue(tx.getOccurredAt().toLocalDate().toString());
                row.createCell(2).setCellValue(tx.getAmount().doubleValue());
                row.createCell(3).setCellValue(tx.getCategory() == null ? tx.getCreditSource().getName() : tx.getCategory().getName());
                row.createCell(4).setCellValue(tx.getSubCategory() == null ? "" : tx.getSubCategory());
                row.createCell(5).setCellValue(tx.getDescription());
                row.createCell(6).setCellValue(tx.getBalanceAfterTransaction().doubleValue());
            }
            for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate Excel", ex);
        }
    }
}
