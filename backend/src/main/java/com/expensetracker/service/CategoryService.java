package com.expensetracker.service;

import com.expensetracker.category.*;
import com.expensetracker.dto.Requests;
import com.expensetracker.dto.Responses;
import com.expensetracker.exception.ApiException;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.transaction.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categories;
    private final SubCategoryRepository subCategories;
    private final TransactionRepository transactions;
    private final CurrentUserService currentUser;

    @Transactional(readOnly = true)
    public java.util.List<Responses.CategoryItem> list() {
        var user = currentUser.currentUser();
        return categories.findByUserIdOrderByDisplayOrder(user.getId()).stream().map(this::item).toList();
    }
    @Transactional
    public Responses.CategoryItem create(Requests.CategoryRequest request) {
        var user = currentUser.currentUser(); uniqueCategory(user.getId(), request.name(), null);
        var category = new Category(); category.setUser(user); category.setName(request.name().trim()); category.setDisplayOrder(categories.findByUserIdOrderByDisplayOrder(user.getId()).size() + 1);
        return item(categories.save(category));
    }
    @Transactional
    public Responses.CategoryItem update(UUID id, Requests.CategoryRequest request) {
        var category = ownedCategory(id); uniqueCategory(category.getUser().getId(), request.name(), id); category.setName(request.name().trim()); return item(category);
    }
    @Transactional
    public void archive(UUID id) {
        var category = ownedCategory(id);
        var children = subCategories.findByCategoryIdOrderByCreatedAt(id);
        if (transactions.existsByCategoryId(id)) { category.setActive(false); children.forEach(s -> s.setActive(false)); }
        else categories.delete(category);
    }
    @Transactional
    public Responses.SubCategoryItem createSub(UUID id, Requests.SubCategoryRequest request) {
        var category = ownedCategory(id); if (!category.isActive()) throw new ApiException(HttpStatus.BAD_REQUEST, "Category is archived");
        uniqueSub(id, request.name(), null);
        var sub = new SubCategory(); sub.setCategory(category); sub.setName(request.name().trim()); return subItem(subCategories.save(sub));
    }
    @Transactional
    public Responses.SubCategoryItem updateSub(UUID id, Requests.SubCategoryRequest request) {
        var sub = subCategories.findByIdAndCategory_User_Id(id, currentUser.currentUser().getId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subcategory not found"));
        uniqueSub(sub.getCategory().getId(), request.name(), id); sub.setName(request.name().trim()); return subItem(sub);
    }
    @Transactional
    public void archiveSub(UUID id) {
        var sub = subCategories.findByIdAndCategory_User_Id(id, currentUser.currentUser().getId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subcategory not found"));
        if (transactions.existsBySubCategoryRefId(id)) sub.setActive(false); else subCategories.delete(sub);
    }
    private Category ownedCategory(UUID id) { return categories.findByIdAndUserId(id, currentUser.currentUser().getId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found")); }
    private void uniqueCategory(UUID user, String name, UUID ignored) { if (categories.findByUserIdOrderByDisplayOrder(user).stream().anyMatch(c -> (ignored == null || !c.getId().equals(ignored)) && c.getName().equalsIgnoreCase(name.trim()))) throw new ApiException(HttpStatus.CONFLICT, "Category name already exists"); }
    private void uniqueSub(UUID category, String name, UUID ignored) { if (subCategories.findByCategoryIdOrderByCreatedAt(category).stream().anyMatch(s -> (ignored == null || !s.getId().equals(ignored)) && s.getName().equalsIgnoreCase(name.trim()))) throw new ApiException(HttpStatus.CONFLICT, "Subcategory name already exists"); }
    private Responses.CategoryItem item(Category c) { return new Responses.CategoryItem(c.getId(), c.getName(), c.isActive(), subCategories.findByCategoryIdOrderByCreatedAt(c.getId()).stream().map(this::subItem).toList()); }
    private Responses.SubCategoryItem subItem(SubCategory s) { return new Responses.SubCategoryItem(s.getId(), s.getName(), s.isActive()); }
}
