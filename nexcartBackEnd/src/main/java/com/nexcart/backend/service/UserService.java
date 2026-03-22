package com.nexcart.backend.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.nexcart.backend.entity.Role;
import com.nexcart.backend.entity.User;
import com.nexcart.backend.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User registerUser(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) throw new RuntimeException("Username is required");
        if (user.getEmail() == null || user.getEmail().isBlank()) throw new RuntimeException("Email is required");
        if (user.getPassword() == null || user.getPassword().isBlank()) throw new RuntimeException("Password is required");

        if (userRepository.findFirstByUsername(user.getUsername()).isPresent()) throw new RuntimeException("Username is already taken");
        if (userRepository.findFirstByEmail(user.getEmail()).isPresent()) throw new RuntimeException("Email is already registered");

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(user.getRole() == null ? Role.CUSTOMER : user.getRole());
        user.setBlocked(false);
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User getProfile(Integer userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(Integer userId, Map<String, Object> updates) {
        User existingUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        String newUsername = getTrimmed(updates, "username");
        String newEmail = getTrimmed(updates, "email");
        String newPhone = getTrimmed(updates, "phone");
        String newAvatarUrl = getTrimmed(updates, "avatarUrl");
        String newAddressLine1 = getTrimmed(updates, "addressLine1");
        String newAddressLine2 = getTrimmed(updates, "addressLine2");
        String newCity = getTrimmed(updates, "city");
        String newState = getTrimmed(updates, "state");
        String newPostalCode = getTrimmed(updates, "postalCode");
        String newCountry = getTrimmed(updates, "country");

        if (updates.containsKey("username") && (newUsername == null || newUsername.isEmpty())) throw new RuntimeException("Username cannot be empty");
        if (updates.containsKey("email") && (newEmail == null || newEmail.isEmpty())) throw new RuntimeException("Email cannot be empty");

        if (newEmail != null && !newEmail.isEmpty() && !newEmail.matches("^\\S+@\\S+\\.\\S+$")) throw new RuntimeException("Invalid email format");
        if (newPhone != null && !newPhone.isEmpty() && !newPhone.matches("^\\d{7,15}$")) throw new RuntimeException("Phone number must contain 7 to 15 digits");

        if (newUsername != null && !newUsername.equals(existingUser.getUsername())) {
            userRepository.findFirstByUsername(newUsername).ifPresent(found -> { throw new RuntimeException("Username is already taken"); });
            existingUser.setUsername(newUsername);
        }

        if (newEmail != null && !newEmail.equals(existingUser.getEmail())) {
            userRepository.findFirstByEmail(newEmail).ifPresent(found -> { throw new RuntimeException("Email is already registered"); });
            existingUser.setEmail(newEmail);
        }

        if (updates.containsKey("phone")) existingUser.setPhone((newPhone == null || newPhone.isBlank()) ? null : newPhone);
        if (updates.containsKey("avatarUrl")) existingUser.setAvatarUrl((newAvatarUrl == null || newAvatarUrl.isBlank()) ? null : newAvatarUrl);
        if (updates.containsKey("addressLine1")) existingUser.setAddressLine1(blankToNull(newAddressLine1));
        if (updates.containsKey("addressLine2")) existingUser.setAddressLine2(blankToNull(newAddressLine2));
        if (updates.containsKey("city")) existingUser.setCity(blankToNull(newCity));
        if (updates.containsKey("state")) existingUser.setState(blankToNull(newState));
        if (updates.containsKey("postalCode")) existingUser.setPostalCode(blankToNull(newPostalCode));
        if (updates.containsKey("country")) existingUser.setCountry(blankToNull(newCountry));

        existingUser.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(existingUser);
    }

    public void changePassword(Integer userId, String currentPassword, String newPassword) {
        User existingUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        if (currentPassword == null || currentPassword.isBlank()) throw new RuntimeException("Current password is required");
        if (!passwordEncoder.matches(currentPassword, existingUser.getPassword())) throw new RuntimeException("Current password is incorrect");
        if (newPassword == null || newPassword.isBlank()) throw new RuntimeException("New password is required");
        if (newPassword.length() < 8) throw new RuntimeException("New password must be at least 8 characters");
        if (!newPassword.matches(".*[A-Z].*") || !newPassword.matches(".*[a-z].*") || !newPassword.matches(".*\\d.*")) {
            throw new RuntimeException("New password must include uppercase, lowercase, and number");
        }

        existingUser.setPassword(passwordEncoder.encode(newPassword));
        existingUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(existingUser);
    }

    private String getTrimmed(Map<String, Object> updates, String key) {
        if (!updates.containsKey(key) || updates.get(key) == null) return null;
        return updates.get(key).toString().trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
