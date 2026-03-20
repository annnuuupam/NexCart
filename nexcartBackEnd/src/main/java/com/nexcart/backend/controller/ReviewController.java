package com.nexcart.backend.controller;

import com.nexcart.backend.entity.Review;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://nex-cart-git-main-annnuuupams-projects.vercel.app", "https://nex-cart-alpha.vercel.app",
                                "https://nex-cart-6dxfirgrk-annnuuupams-projects.vercel.app"}, allowCredentials = "true")
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/{productId}")
    public ResponseEntity<?> getReviews(@PathVariable("productId") Integer productId) {
        try {
            List<Review> reviews = reviewService.getReviewsByProduct(productId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load reviews");
        }
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Map<String, Object> request, HttpServletRequest httpServletRequest) {
        try {
            User authenticatedUser = (User) httpServletRequest.getAttribute("authenticatedUser");
            Integer productId = Integer.valueOf(String.valueOf(request.get("productId")));
            Integer rating = Integer.valueOf(String.valueOf(request.get("rating")));
            String comment = request.get("comment") == null ? "" : String.valueOf(request.get("comment"));

            Review review = reviewService.createReview(productId, rating, comment, authenticatedUser);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create review");
        }
    }
}
