package com.nexcart.backend.integration;

import com.nexcart.backend.entity.Category;
import com.nexcart.backend.entity.Product;
import com.nexcart.backend.entity.Role;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.CategoryRepository;
import com.nexcart.backend.repository.ProductRepository;
import com.nexcart.backend.repository.UserRepository;
import com.nexcart.backend.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProductAndAdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void shouldReturnPaginatedProductsWithSearch() throws Exception {
        User customer = createUser("it_customer_1", Role.CUSTOMER);

        Category category = new Category();
        category.setCategoryName("Shirts-Test");
        category = categoryRepository.save(category);

        for (int i = 1; i <= 15; i++) {
            Product product = new Product();
            product.setName("Shirt Test " + i);
            product.setDescription("Description " + i);
            product.setPrice(BigDecimal.valueOf(499 + i));
            product.setStock(30 + i);
            product.setCategory(category);
            product.setCreatedAt(LocalDateTime.now());
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);
        }

        String token = authService.generateToken(customer);

        mockMvc.perform(get("/api/products")
                        .param("q", "Shirt Test")
                        .param("page", "0")
                        .param("size", "5")
                        .cookie(authCookie(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products.length()").value(5))
                .andExpect(jsonPath("$.pagination.page").value(0))
                .andExpect(jsonPath("$.pagination.size").value(5))
                .andExpect(jsonPath("$.pagination.totalElements").value(15))
                .andExpect(jsonPath("$.pagination.totalPages").value(3))
                .andExpect(jsonPath("$.pagination.hasNext").value(true))
                .andExpect(jsonPath("$.pagination.hasPrevious").value(false));

        mockMvc.perform(get("/api/products")
                        .param("q", "Shirt Test")
                        .param("page", "1")
                        .param("size", "5")
                        .cookie(authCookie(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products.length()").value(5))
                .andExpect(jsonPath("$.pagination.page").value(1))
                .andExpect(jsonPath("$.pagination.hasPrevious").value(true));
    }

    @Test
    void shouldAllowAdminBlockUnblockAndDeleteUser() throws Exception {
        User admin = createUser("it_admin_1", Role.ADMIN);
        User customer = createUser("it_customer_2", Role.CUSTOMER);

        String adminToken = authService.generateToken(admin);

        mockMvc.perform(put("/admin/users/{id}/block", customer.getUserId())
                        .cookie(adminAuthCookie(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocked").value(true))
                .andExpect(jsonPath("$.status").value("BLOCKED"));

        mockMvc.perform(put("/admin/users/{id}/unblock", customer.getUserId())
                        .cookie(adminAuthCookie(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocked").value(false))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(delete("/admin/users/{id}", customer.getUserId())
                        .cookie(adminAuthCookie(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deleted"));

        mockMvc.perform(get("/admin/users/{id}", customer.getUserId())
                        .cookie(adminAuthCookie(adminToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldSuccessfullyResetPassword() throws Exception {
        User customer = createUser("reset_customer", Role.CUSTOMER);
        customer.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("OldPass@123"));
        userRepository.save(customer);

        // 1. Fetch Captcha Challenge
        String captchaResponse = mockMvc.perform(get("/api/auth/captcha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.captchaId").exists())
                .andExpect(jsonPath("$.question").exists())
                .andReturn().getResponse().getContentAsString();

        String captchaId = com.jayway.jsonpath.JsonPath.read(captchaResponse, "$.captchaId");
        String question = com.jayway.jsonpath.JsonPath.read(captchaResponse, "$.question");

        // Parse arithmetic question (e.g. "What is 4 + 7 ?")
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("What is (\\d+) \\+ (\\d+) \\?").matcher(question);
        if (!matcher.find()) {
            throw new IllegalStateException("Failed to parse captcha question: " + question);
        }
        int a = Integer.parseInt(matcher.group(1));
        int b = Integer.parseInt(matcher.group(2));
        String answer = String.valueOf(a + b);

        // 2. Request Forgot Password
        String forgotBody = String.format(
                "{\"identifier\":\"%s\",\"captchaId\":\"%s\",\"captchaAnswer\":\"%s\"}",
                customer.getEmail(), captchaId, answer
        );

        String forgotResponse = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/forgot-password")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(forgotBody)
                        .header("Origin", "http://localhost:5174")) // Triggers localhost local bypass to return token
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken").exists())
                .andReturn().getResponse().getContentAsString();

        String resetToken = com.jayway.jsonpath.JsonPath.read(forgotResponse, "$.resetToken");

        // 3. Reset Password
        String resetBody = String.format(
                "{\"token\":\"%s\",\"newPassword\":\"NewPass@123\",\"confirmPassword\":\"NewPass@123\"}",
                resetToken
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/reset-password")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));

        // 4. Verify Login with New Password
        String loginBody = String.format(
                "{\"username\":\"%s\",\"password\":\"NewPass@123\"}",
                customer.getUsername()
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    private User createUser(String username, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@nexcart.test");
        user.setPassword("dummy-password");
        user.setRole(role);
        user.setBlocked(false);
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private Cookie authCookie(String token) {
        Cookie cookie = new Cookie("authToken", token);
        cookie.setPath("/");
        return cookie;
    }

    private Cookie adminAuthCookie(String token) {
        Cookie cookie = new Cookie("adminAuthToken", token);
        cookie.setPath("/");
        return cookie;
    }
}
