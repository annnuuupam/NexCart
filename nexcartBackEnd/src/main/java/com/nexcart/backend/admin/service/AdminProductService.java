package com.nexcart.backend.admin.service;

import com.nexcart.backend.entity.Category;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.repository.CategoryRepository;
import com.nexcart.backend.repository.ProductImageRepository;
import com.nexcart.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AdminProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;

    public AdminProductService(ProductRepository productRepository, ProductImageRepository productImageRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public Product addProductWithImages(String name, String description, Double price, Integer stock, Integer categoryId, List<String> imageUrls) {
        Optional<Category> category = categoryRepository.findById(categoryId);
        if (category.isEmpty()) throw new IllegalArgumentException("Invalid category ID");

        if (stock != null && stock < 0) throw new IllegalArgumentException("Stock cannot be negative");

        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(BigDecimal.valueOf(price));
        product.setStock(stock);
        product.setCategory(category.get());
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        Product savedProduct = productRepository.save(product);

        for (String imageUrl : sanitizeImageUrls(imageUrls)) {
            var productImage = new com.nexcart.backend.entity.ProductImage();
            productImage.setProduct(savedProduct);
            productImage.setImageUrl(imageUrl);
            productImageRepository.save(productImage);
        }

        return savedProduct;
    }

    @Transactional
    public Product updateProductWithImages(Integer productId, String name, String description, Double price,
                                           Integer stock, Integer categoryId, List<String> imageUrls, boolean clearImages) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (stock != null && stock < 0) throw new IllegalArgumentException("Stock cannot be negative");

        if (name != null && !name.isBlank()) product.setName(name);
        if (description != null) product.setDescription(description);
        if (price != null) product.setPrice(BigDecimal.valueOf(price));
        if (stock != null) product.setStock(stock);
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElseThrow(() -> new IllegalArgumentException("Invalid category ID"));
            product.setCategory(category);
        }
        product.setUpdatedAt(LocalDateTime.now());

        Product saved = productRepository.save(product);

        if (imageUrls != null) {
            List<String> sanitized = sanitizeImageUrls(imageUrls);
            if (!sanitized.isEmpty()) {
                // Replace images only when new URLs are provided.
                productImageRepository.deleteByProductId(productId);
                for (String imageUrl : sanitized) {
                    var image = new com.nexcart.backend.entity.ProductImage();
                    image.setProduct(saved);
                    image.setImageUrl(imageUrl);
                    productImageRepository.save(image);
                }
            } else if (clearImages) {
                // Explicit removal only when admin confirms.
                productImageRepository.deleteByProductId(productId);
            }
        }

        return saved;
    }

    @Transactional
    public void deleteProduct(Integer productId) {
        if (!productRepository.existsById(productId)) throw new IllegalArgumentException("Product not found");

        productImageRepository.deleteByProductId(productId);
        productRepository.deleteById(productId);
    }

    private List<String> sanitizeImageUrls(List<String> urls) {
        List<String> result = new ArrayList<>();
        if (urls == null) return result;
        for (String url : urls) {
            if (url == null) continue;
            String trimmed = url.trim();
            if (!trimmed.isEmpty()) result.add(trimmed);
        }
        return result;
    }
}




