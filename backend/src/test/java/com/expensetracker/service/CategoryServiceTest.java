package com.expensetracker.service;

import com.expensetracker.category.Category;
import com.expensetracker.category.CategoryRepository;
import com.expensetracker.category.SubCategoryRepository;
import com.expensetracker.security.CurrentUserService;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.user.AppUserRepository;
import com.expensetracker.transaction.TransactionRepository;
import com.expensetracker.user.AppUser;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CategoryServiceTest {
    @Test
    void archivedCategoryWithHistoryIsDeactivatedWithoutDeletingIt() {
        var categories = mock(CategoryRepository.class);
        var subs = mock(SubCategoryRepository.class);
        var transactions = mock(TransactionRepository.class);
        var userRepository = mock(AppUserRepository.class);
        var user = new AppUser(); user.setId(UUID.randomUUID());
        var category = new Category(); category.setUser(user); category.setName("Travel"); category.setActive(true);
        var id = UUID.randomUUID(); category.setId(id);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new UserPrincipal(user.getId(), "Test", "test@example.com", "pw"), "pw", List.of()));
        when(categories.findByIdAndUserId(id, user.getId())).thenReturn(Optional.of(category));
        when(transactions.existsByCategoryId(id)).thenReturn(true);
        when(subs.findByCategoryIdOrderByCreatedAt(id)).thenReturn(java.util.List.of());

        new CategoryService(categories, subs, transactions, new CurrentUserService(userRepository)).archive(id);

        assertFalse(category.isActive());
        verify(categories, never()).delete(category);
        SecurityContextHolder.clearContext();
    }

    @Test
    void anotherUsersCategoryCannotBeArchived() {
        var categories = mock(CategoryRepository.class);
        var userRepository = mock(AppUserRepository.class);
        var user = new AppUser(); user.setId(UUID.randomUUID());
        var otherId = UUID.randomUUID();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(new UserPrincipal(user.getId(), "Test", "test@example.com", "pw"), "pw", List.of()));
        when(categories.findByIdAndUserId(otherId, user.getId())).thenReturn(Optional.empty());
        var service = new CategoryService(categories, mock(SubCategoryRepository.class), mock(TransactionRepository.class), new CurrentUserService(userRepository));

        assertThrows(RuntimeException.class, () -> service.archive(otherId));
        verify(categories, never()).deleteById(otherId);
        SecurityContextHolder.clearContext();
    }
}
