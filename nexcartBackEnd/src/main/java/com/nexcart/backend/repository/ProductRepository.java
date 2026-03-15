package com.nexcart.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nexcart.backend.entity.Product;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByCategory_CategoryId(Integer categoryId);

    Page<Product> findByCategory_CategoryId(Integer categoryId, Pageable pageable);

    Page<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description, Pageable pageable);

    Page<Product> findByCategory_CategoryIdAndNameContainingIgnoreCaseOrCategory_CategoryIdAndDescriptionContainingIgnoreCase(
            Integer categoryIdForName,
            String name,
            Integer categoryIdForDescription,
            String description,
            Pageable pageable
    );

    long countByCategory_CategoryId(Integer categoryId);

    @Query("SELECT p.category.categoryName FROM Product p WHERE p.productId = :productId")
    String findCategoryNameByProductId(int productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :productId")
    Optional<Product> findByIdForUpdate(@Param("productId") Integer productId);
}
