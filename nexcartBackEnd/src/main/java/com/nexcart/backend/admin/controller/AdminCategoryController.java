package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminCategoryService;
import com.nexcart.backend.entity.Category;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/categories")
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    public AdminCategoryController(AdminCategoryService adminCategoryService) {
        this.adminCategoryService = adminCategoryService;
    }

    @GetMapping
    public ResponseEntity<?> getCategories() {
        try {
            return ResponseEntity.ok(adminCategoryService.getAllCategories());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load categories");
        }
    }

    @PostMapping
    public ResponseEntity<?> addCategory(@RequestBody Map<String, Object> request) {
        try {
            String categoryName = String.valueOf(request.get("categoryName"));
            String imageUrl = request.get("imageUrl") == null ? "" : String.valueOf(request.get("imageUrl"));
            Category category = adminCategoryService.addCategory(categoryName, imageUrl);
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add category");
        }
    }

    @PutMapping
    public ResponseEntity<?> updateCategory(@RequestBody Map<String, Object> request) {
        try {
            Integer categoryId = Integer.valueOf(String.valueOf(request.get("categoryId")));
            String categoryName = String.valueOf(request.get("categoryName"));
            String imageUrl = request.get("imageUrl") == null ? "" : String.valueOf(request.get("imageUrl"));
            Category category = adminCategoryService.updateCategory(categoryId, categoryName, imageUrl);
            return ResponseEntity.ok(category);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update category");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteCategory(@RequestBody Map<String, Object> request) {
        try {
            Integer categoryId = Integer.valueOf(String.valueOf(request.get("categoryId")));
            adminCategoryService.deleteCategory(categoryId);
            return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete category");
        }
    }
}
