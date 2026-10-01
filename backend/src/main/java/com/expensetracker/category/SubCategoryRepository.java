package com.expensetracker.category;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubCategoryRepository extends JpaRepository<SubCategory, UUID> {
    List<SubCategory> findByCategoryIdOrderByCreatedAt(UUID categoryId);
    Optional<SubCategory> findByIdAndCategory_User_Id(UUID id, UUID userId);
    boolean existsByCategoryIdAndNameIgnoreCase(UUID categoryId, String name);
}
