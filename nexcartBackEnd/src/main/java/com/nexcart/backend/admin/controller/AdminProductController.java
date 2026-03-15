package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminProductService;
import com.nexcart.backend.entity.Product;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/products")
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addProduct(@RequestBody Map<String, Object> productRequest) {
        try {
            String name = String.valueOf(productRequest.get("name"));
            String description = String.valueOf(productRequest.get("description"));
            Double price = Double.valueOf(String.valueOf(productRequest.get("price")));
            Integer stock = Integer.valueOf(String.valueOf(productRequest.get("stock")));
            Integer categoryId = Integer.valueOf(String.valueOf(productRequest.get("categoryId")));

            List<String> imageUrls = parseImageUrls(productRequest);

            Product addedProduct = adminProductService.addProductWithImages(name, description, price, stock, categoryId, imageUrls);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Product created successfully",
                    "productId", addedProduct.getProductId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", e.getMessage() == null ? "Something went wrong" : e.getMessage()
            ));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProduct(@RequestBody Map<String, Object> productRequest) {
        try {
            Integer productId = Integer.valueOf(String.valueOf(productRequest.get("productId")));
            String name = productRequest.get("name") == null ? null : String.valueOf(productRequest.get("name"));
            String description = productRequest.get("description") == null ? null : String.valueOf(productRequest.get("description"));
            Double price = productRequest.get("price") == null ? null : Double.valueOf(String.valueOf(productRequest.get("price")));
            Integer stock = productRequest.get("stock") == null ? null : Integer.valueOf(String.valueOf(productRequest.get("stock")));
            Integer categoryId = productRequest.get("categoryId") == null ? null : Integer.valueOf(String.valueOf(productRequest.get("categoryId")));

            boolean clearImages = false;
            if (productRequest.get("clearImages") != null) {
                clearImages = Boolean.parseBoolean(String.valueOf(productRequest.get("clearImages")));
            }

            List<String> imageUrls = null;
            if (productRequest.containsKey("imageUrls") || productRequest.containsKey("imageUrl")) {
                imageUrls = parseImageUrls(productRequest);
            }
            if (clearImages && imageUrls == null) {
                imageUrls = List.of();
            }

            Product updatedProduct = adminProductService.updateProductWithImages(
                    productId,
                    name,
                    description,
                    price,
                    stock,
                    categoryId,
                    imageUrls,
                    clearImages
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Product updated successfully",
                    "productId", updatedProduct.getProductId(),
                    "updatedAt", updatedProduct.getUpdatedAt()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", e.getMessage() == null ? "Something went wrong" : e.getMessage()
            ));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteProduct(@RequestBody Map<String, Object> requestBody) {
        try {
            Integer productId = Integer.valueOf(String.valueOf(requestBody.get("productId")));
            adminProductService.deleteProduct(productId);
            return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "Product deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", e.getMessage() == null ? "Something went wrong" : e.getMessage()
            ));
        }
    }

    private List<String> parseImageUrls(Map<String, Object> productRequest) {
        Object imageUrlsRaw = productRequest.get("imageUrls");
        List<String> imageUrls = new ArrayList<>();

        if (imageUrlsRaw instanceof List<?> rawList) {
            for (Object entry : rawList) {
                if (entry != null) {
                    String value = entry.toString().trim();
                    if (!value.isEmpty()) imageUrls.add(value);
                }
            }
        }

        if (imageUrls.isEmpty() && productRequest.get("imageUrl") != null) {
            String single = String.valueOf(productRequest.get("imageUrl")).trim();
            if (!single.isEmpty() && !"null".equalsIgnoreCase(single)) imageUrls.add(single);
        }

        return imageUrls;
    }
}
