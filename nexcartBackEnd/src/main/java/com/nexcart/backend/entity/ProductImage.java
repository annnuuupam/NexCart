package com.nexcart.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "productimages")
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer imageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "is_primary", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean isPrimary = false;

    public ProductImage() {
    }

    public ProductImage(Product product, String imageUrl) {
        this.product = product;
        this.imageUrl = imageUrl;
        this.isPrimary = false;
    }

    public ProductImage(Product product, String imageUrl, boolean isPrimary) {
        this.product = product;
        this.imageUrl = imageUrl;
        this.isPrimary = isPrimary;
    }

    public ProductImage(Integer imageId, Product product, String imageUrl) {
        this.imageId = imageId;
        this.product = product;
        this.imageUrl = imageUrl;
        this.isPrimary = false;
    }

    public Integer getImageId() {
        return imageId;
    }

    public void setImageId(Integer imageId) {
        this.imageId = imageId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean isPrimary) {
        this.isPrimary = isPrimary;
    }
}
