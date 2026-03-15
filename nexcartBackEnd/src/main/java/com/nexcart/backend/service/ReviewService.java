package com.nexcart.backend.service;

import com.nexcart.backend.entity.Review;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    public List<Review> getReviewsByProduct(Integer productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Review createReview(Integer productId, Integer rating, String comment, User user) {
        if (user == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        if (!productRepository.existsById(productId)) {
            throw new IllegalArgumentException("Product not found");
        }

        Review review = new Review();
        review.setUserId(user.getUserId());
        review.setProductId(productId);
        review.setRating(rating);
        review.setComment(comment == null ? "" : comment.trim());
        return reviewRepository.save(review);
    }
}
