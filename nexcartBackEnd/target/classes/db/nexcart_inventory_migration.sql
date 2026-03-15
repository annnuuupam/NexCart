-- Inventory migration for NexCart
USE nexcart;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_status ENUM('AVAILABLE','OUT_OF_STOCK') NOT NULL DEFAULT 'AVAILABLE';

UPDATE products
SET stock_quantity = COALESCE(stock_quantity, stock);

UPDATE products
SET product_status = CASE WHEN stock_quantity > 0 THEN 'AVAILABLE' ELSE 'OUT_OF_STOCK' END;
