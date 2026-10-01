package com.expensetracker.service;

import com.expensetracker.category.Category;
import com.expensetracker.category.CategoryRepository;
import com.expensetracker.category.SubCategory;
import com.expensetracker.category.SubCategoryRepository;
import com.expensetracker.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class CategoryTemplateService {
    private final JdbcTemplate jdbc;
    private final CategoryRepository categories;
    private final SubCategoryRepository subCategories;

    @Transactional
    public void initializeFor(AppUser user) {
        jdbc.query("select category_name, display_order from category_templates order by display_order", rs -> {
            var category = new Category(); category.setUser(user); category.setName(rs.getString("category_name")); category.setDisplayOrder(rs.getInt("display_order"));
            category = categories.save(category);
            var savedCategory = category;
            jdbc.query("select name from sub_category_templates where category_name = ? order by name", sub -> {
                var item = new SubCategory(); item.setCategory(savedCategory); item.setName(sub.getString("name")); subCategories.save(item);
            }, savedCategory.getName());
        });
    }
}
