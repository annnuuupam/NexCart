package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Category;
import com.nexcart.backend.repository.CategoryRepository;
import com.nexcart.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public AdminCategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Map<String, Object>> getAllCategories() {
        return categoryRepository.findAll().stream().map(category -> {
            Map<String, Object> item = new HashMap<>();
            item.put("categoryId", category.getCategoryId());
            item.put("categoryName", category.getCategoryName());
            item.put("productCount", productRepository.countByCategory_CategoryId(category.getCategoryId()));
            item.put("imageUrl", category.getImageUrl() == null ? "" : category.getImageUrl());
            return item;
        }).toList();
    }

    public Category addCategory(String categoryName, String imageUrl) {
        if (categoryName == null || categoryName.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }

        String normalizedName = categoryName.trim();
        if (categoryRepository.findByCategoryName(normalizedName).isPresent()) {
            throw new IllegalArgumentException("Category already exists");
        }

        Category category = new Category();
        category.setCategoryName(normalizedName);
        category.setImageUrl(imageUrl == null ? "" : imageUrl.trim());
        return categoryRepository.save(category);
    }

    public Category updateCategory(Integer categoryId, String categoryName, String imageUrl) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (categoryName == null || categoryName.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }

        category.setCategoryName(categoryName.trim());
        category.setImageUrl(imageUrl == null ? "" : imageUrl.trim());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Integer categoryId) {
        if (productRepository.countByCategory_CategoryId(categoryId) > 0) {
            throw new IllegalArgumentException("Cannot delete category with products");
        }
        if (!categoryRepository.existsById(categoryId)) {
            throw new IllegalArgumentException("Category not found");
        }
        categoryRepository.deleteById(categoryId);
    }
}
