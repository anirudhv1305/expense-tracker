package com.expensetracker.controller;

import com.expensetracker.dto.Requests;
import com.expensetracker.dto.Responses;
import com.expensetracker.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/categories") @RequiredArgsConstructor
public class CategoryController {
    private final CategoryService service;
    @GetMapping public List<Responses.CategoryItem> list() { return service.list(); }
    @PostMapping public Responses.CategoryItem create(@Valid @RequestBody Requests.CategoryRequest r) { return service.create(r); }
    @PutMapping("/{id}") public Responses.CategoryItem update(@PathVariable UUID id, @Valid @RequestBody Requests.CategoryRequest r) { return service.update(id, r); }
    @DeleteMapping("/{id}") public void archive(@PathVariable UUID id) { service.archive(id); }
    @PostMapping("/{id}/subcategories") public Responses.SubCategoryItem createSub(@PathVariable UUID id, @Valid @RequestBody Requests.SubCategoryRequest r) { return service.createSub(id, r); }
    @PutMapping("/subcategories/{id}") public Responses.SubCategoryItem updateSub(@PathVariable UUID id, @Valid @RequestBody Requests.SubCategoryRequest r) { return service.updateSub(id, r); }
    @DeleteMapping("/subcategories/{id}") public void archiveSub(@PathVariable UUID id) { service.archiveSub(id); }
}
