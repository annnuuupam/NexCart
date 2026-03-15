package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminDashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(@RequestParam(name = "days", defaultValue = "14") int days) {
        try {
            return ResponseEntity.ok(adminDashboardService.getDashboardOverview(days));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to load dashboard overview");
        }
    }
}
