package com.expensetracker.controller;

import com.expensetracker.month.MonthlyRecordRepository;
import com.expensetracker.exception.ApiException;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Month;
import java.util.UUID;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {
    private final ReportService reportService;
    private final MonthlyRecordRepository monthlyRecordRepository;
    private final CurrentUserService currentUserService;

    @GetMapping("/{monthId}/csv")
    public ResponseEntity<byte[]> csv(@PathVariable UUID monthId) {
        return file(reportService.csv(monthId), filename(monthId, "csv"), "text/csv");
    }

    @GetMapping("/{monthId}/excel")
    public ResponseEntity<byte[]> excel(@PathVariable UUID monthId) {
        return file(reportService.excel(monthId), filename(monthId, "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    private ResponseEntity<byte[]> file(byte[] body, String filename, String contentType) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(body);
    }

    private String filename(UUID monthId, String ext) {
        var user = currentUserService.currentUser();
        var month = monthlyRecordRepository.findByIdAndUserId(monthId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found"));
        var name = Month.of(month.getMonth()).name().charAt(0) + Month.of(month.getMonth()).name().substring(1).toLowerCase();
        return name + "_" + month.getYear() + "." + ext;
    }
}
