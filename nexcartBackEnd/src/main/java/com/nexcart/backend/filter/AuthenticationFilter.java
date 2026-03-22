package com.nexcart.backend.filter;

import com.nexcart.backend.entity.Role;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.UserRepository;
import com.nexcart.backend.service.AuthService;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

@WebFilter(urlPatterns = {"/api/*", "/admin/*"})
public class AuthenticationFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);
    private final AuthService authService;
    private final UserRepository userRepository;

    // Read from env var; multiple origins can be comma-separated
    @Value("${app.frontend.base-url:https://nex-cart-alpha.vercel.app}")
    private String frontendBaseUrl;

    private static final String[] UNAUTHENTICATED_PATHS = {
        "/api/users/register",
        "/api/auth/login",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/captcha"
    };

    public AuthenticationFilter(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        try {
            executeFilterLogic(httpRequest, httpResponse, chain);
        } catch (IOException | ServletException e) {
            throw e;
        } catch (RuntimeException e) {
            logger.warn("Auth error in filter: {}", e.getMessage());
            if (!httpResponse.isCommitted()) {
                sendErrorResponse(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: " + e.getMessage());
            }
        } catch (Exception e) {
            logger.error("Unexpected error in AuthenticationFilter", e);
            if (!httpResponse.isCommitted()) {
                sendErrorResponse(httpResponse, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
            }
        }
    }

    private void executeFilterLogic(HttpServletRequest httpRequest, HttpServletResponse httpResponse, FilterChain chain)
            throws IOException, ServletException {
        String requestURI = httpRequest.getRequestURI();
        logger.info("Request URI: {}", requestURI);

        if (Arrays.asList(UNAUTHENTICATED_PATHS).contains(requestURI)) {
            chain.doFilter(httpRequest, httpResponse);
            return;
        }

        String token = getAuthTokenFromCookies(httpRequest);
        if (token == null || !authService.validateToken(token)) {
            sendErrorResponse(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Invalid or missing token");
            return;
        }

        String username = authService.extractUsername(token);
        Optional<User> userOptional = userRepository.findFirstByUsername(username);
        if (userOptional.isEmpty()) {
            sendErrorResponse(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: User not found");
            return;
        }

        User authenticatedUser = userOptional.get();
        if (Boolean.TRUE.equals(authenticatedUser.getBlocked()) || "BLOCKED".equalsIgnoreCase(authenticatedUser.getStatus())) {
            sendErrorResponse(httpResponse, HttpServletResponse.SC_FORBIDDEN, "Forbidden: Account is blocked");
            return;
        }
        Role role = authenticatedUser.getRole();
        logger.info("Authenticated User: {}, Role: {}", authenticatedUser.getUsername(), role);

        if (requestURI.startsWith("/admin/") && role != Role.ADMIN) {
            sendErrorResponse(httpResponse, HttpServletResponse.SC_FORBIDDEN, "Forbidden: Admin access required");
            return;
        }

        httpRequest.setAttribute("authenticatedUser", authenticatedUser);
        chain.doFilter(httpRequest, httpResponse);
    }



    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message.replace("\"", "\\\"") + "\"}");
    }

    private String getAuthTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            return Arrays.stream(cookies)
                    .filter(cookie -> "authToken".equals(cookie.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }
}
