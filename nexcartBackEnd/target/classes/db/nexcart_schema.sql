-- NexCart schema (aligned with JPA entities)
CREATE DATABASE IF NOT EXISTS nexcart;
USE nexcart;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS productimages;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS jwt_tokens;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('ADMIN','CUSTOMER') NOT NULL,
  blocked TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE jwt_tokens (
  token_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(1024) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  PRIMARY KEY (token_id),
  INDEX idx_jwt_user_id (user_id),
  UNIQUE KEY uk_jwt_token (token),
  CONSTRAINT fk_jwt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
  category_id INT NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT NULL,
  PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  product_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL,
  product_status ENUM('AVAILABLE','OUT_OF_STOCK') NOT NULL DEFAULT 'AVAILABLE',
  category_id INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_status (product_status),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE productimages (
  image_id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url TEXT NOT NULL,
  PRIMARY KEY (image_id),
  INDEX idx_productimages_product_id (product_id),
  CONSTRAINT fk_productimages_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cart_items (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_user_product (user_id, product_id),
  INDEX idx_cart_product_id (product_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  order_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  coupon_code VARCHAR(80) NULL,
  shipping_address TEXT NULL,
  payment_method VARCHAR(30) NULL,
  order_status ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS','CANCELLED','RETURN_REQUESTED','RETURN_APPROVED','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING',
  payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  tracking_number VARCHAR(60) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  INDEX idx_orders_user_id (user_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id INT NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE system_settings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE coupons (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  maximum_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date DATE NOT NULL,
  usage_limit INT NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(255) NOT NULL,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payments_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(1200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_reviews_product_id (product_id),
  INDEX idx_reviews_user_id (user_id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE returns (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  reason VARCHAR(500),
  request_type ENUM('RETURN','REFUND') NOT NULL DEFAULT 'RETURN',
  status ENUM('REQUESTED','APPROVED','REJECTED','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
  refund_status ENUM('PENDING','PROCESSED') NOT NULL DEFAULT 'PENDING',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_returns_order_id (order_id),
  INDEX idx_returns_product_id (product_id),
  INDEX idx_returns_user_id (user_id),
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_returns_product FOREIGN KEY (product_id) REFERENCES products(product_id),
  CONSTRAINT fk_returns_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

