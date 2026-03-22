package com.nexcart.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nexcart.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findFirstByEmail(String email);
    Optional<User> findFirstByUsername(String username);
    List<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
            String username,
            String email,
            String phone
    );

    @Query("SELECT u FROM User u WHERE (:query IS NULL OR :query = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%'))) AND (:blocked IS NULL OR u.blocked = :blocked)")
    Page<User> searchUsers(@Param("query") String query, @Param("blocked") Boolean blocked, Pageable pageable);
}
