package com.nexcart.backend.admin.controller;

import com.nexcart.backend.admin.service.AdminUserService;
import com.nexcart.backend.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/user")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @PutMapping("/modify")
    public ResponseEntity<?> modifyUser(@RequestBody Map<String, Object> userRequest) {
        try {
            Integer userId = Integer.valueOf(String.valueOf(userRequest.get("userId")));
            String username = (String) userRequest.get("username");
            String email = (String) userRequest.get("email");
            String role = (String) userRequest.get("role");
            User updatedUser = adminUserService.modifyUser(userId, username, email, role);
            return ResponseEntity.status(HttpStatus.OK).body(adminUserService.buildUserSummary(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }

    @PutMapping("/block")
    public ResponseEntity<?> blockUser(@RequestBody Map<String, Object> userRequest) {
        try {
            Integer userId = Integer.valueOf(String.valueOf(userRequest.get("userId")));
            Boolean blocked = Boolean.valueOf(String.valueOf(userRequest.get("blocked")));
            User updatedUser = adminUserService.setUserBlocked(userId, blocked);
            return ResponseEntity.ok(adminUserService.buildUserSummary(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<Map<String, Object>> users = adminUserService.getAllUsers().stream()
                    .map(adminUserService::buildUserSummary)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }

    @PostMapping("/getbyid")
    public ResponseEntity<?> getUserById(@RequestBody Map<String, Object> userRequest) {
        try {
            Integer userId = Integer.valueOf(String.valueOf(userRequest.get("userId")));
            User user = adminUserService.getUserById(userId);
            return ResponseEntity.status(HttpStatus.OK).body(adminUserService.buildUserSummary(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
        }
    }
}
