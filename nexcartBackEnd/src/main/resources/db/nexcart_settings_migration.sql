-- Migration for system settings + order totals
USE nexcart;

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NULL;

INSERT INTO system_settings (setting_key, setting_value) VALUES
('free_shipping_threshold', '999'),
('domestic_shipping_charge', '79'),
('international_shipping_charge', '499'),
('dispatch_sla_hours', '24'),
('gst_percentage', '18'),
('tax_enabled', 'true'),
('stripe_enabled', 'false'),
('razorpay_enabled', 'true'),
('paypal_enabled', 'false'),
('cod_enabled', 'true'),
('store_name', 'NexCart'),
('store_email', 'support@nexcart.com'),
('store_phone', ''),
('store_logo', '')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
