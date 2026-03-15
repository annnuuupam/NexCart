-- NexCart migration (non-destructive)
-- Run this against your existing database to add new columns/tables without data loss.

-- Orders: add workflow + payment fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','SUCCESS','CANCELLED','RETURN_REQUESTED','RETURN_APPROVED','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(60) NULL;

-- Backfill order_status if legacy status column exists
UPDATE orders SET order_status = status WHERE order_status IS NULL AND status IS NOT NULL;

-- Coupons: add min/max + active
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS maximum_discount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS active TINYINT(1) NOT NULL DEFAULT 1;

-- Returns table (create if missing)
CREATE TABLE IF NOT EXISTS returns (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  reason VARCHAR(500),
  request_type ENUM('RETURN','REFUND') NOT NULL DEFAULT 'RETURN',
  status ENUM('REQUESTED','APPROVED','REJECTED','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
  refund_status ENUM('PENDING','PROCESSED') NOT NULL DEFAULT 'PENDING',
  refund_amount DECIMAL(12,2) NULL,
  refund_reference VARCHAR(120) NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_returns_order_id (order_id),
  INDEX idx_returns_product_id (product_id),
  INDEX idx_returns_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Returns: add refund columns if table already exists
ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12,2) NULL;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(120) NULL;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_status ENUM('PENDING','PROCESSED') NOT NULL DEFAULT 'PENDING';
