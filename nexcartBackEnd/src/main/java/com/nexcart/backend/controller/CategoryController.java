package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Category;
import com.nexcart.backend.repository.CategoryRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ResponseEntity<?> getCategories(HttpServletRequest request) {
        try {
            List<Category> categories = categoryRepository.findAll();
            List<Map<String, Object>> payload = categories.stream().map(category -> {
                Map<String, Object> row = new HashMap<>();
                row.put("categoryId", category.getCategoryId());
                row.put("categoryName", category.getCategoryName());
                row.put("imageUrl", category.getImageUrl());
                return row;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("categories", payload));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load categories"));
        }
    }
}
