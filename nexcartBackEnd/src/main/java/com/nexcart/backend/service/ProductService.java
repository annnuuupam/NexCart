package com.nexcart.backend.service;

import com.nexcart.backend.entity.Category;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.ProductImage;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.repository.ProductImageRepository;
import com.nexcart.backend.repository.CategoryRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Product> getProductsByCategory(String categoryName) {
        return getProducts(categoryName, null, 0, 1000).getContent();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<Product> getProducts(String categoryName, String query, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        boolean hasQuery = query != null && !query.trim().isEmpty();

        if (categoryName != null && !categoryName.isEmpty()) {
            Optional<Category> categoryOpt = categoryRepository.findByCategoryName(categoryName);
            if (categoryOpt.isEmpty()) {
                throw new RuntimeException("Category not found");
            }

            Integer categoryId = categoryOpt.get().getCategoryId();
            if (hasQuery) {
                String normalizedQuery = query.trim();
                return productRepository
                        .findByCategory_CategoryIdAndNameContainingIgnoreCaseOrCategory_CategoryIdAndDescriptionContainingIgnoreCase(
                                categoryId,
                                normalizedQuery,
                                categoryId,
                                normalizedQuery,
                                pageable
                        );
            }

            return productRepository.findByCategory_CategoryId(categoryId, pageable);
        }

        if (hasQuery) {
            String normalizedQuery = query.trim();
            return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                    normalizedQuery,
                    normalizedQuery,
                    pageable
            );
        }

        return productRepository.findAll(pageable);
    }

    public Product getProductById(Integer productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public List<Product> getProductsByIds(List<Integer> ids) {
        return ids == null || ids.isEmpty() ? List.of() : productRepository.findAllById(ids);
    }

    public List<String> getProductImages(Integer productId) {
        List<ProductImage> productImages = productImageRepository.findByProduct_ProductId(productId);
        List<String> imageUrls = new ArrayList<>();
        for (ProductImage image : productImages) {
            imageUrls.add(image.getImageUrl());
        }
        return imageUrls;
    }
}
