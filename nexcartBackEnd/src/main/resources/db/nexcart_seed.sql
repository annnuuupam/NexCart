-- Minimal seed data for NexCart
USE nexcart;

INSERT INTO categories (category_name)
VALUES ('Shirts'), ('Pants'), ('Accessories'), ('Mobiles'), ('Mobile Accessories')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO products (name, description, price, stock_quantity, category_id, product_status)
SELECT 'Starter Shirt', 'Sample product', 499.00, 50, c.category_id, 'AVAILABLE'
FROM categories c WHERE c.category_name = 'Shirts'
ON DUPLICATE KEY UPDATE stock_quantity = stock_quantity;

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
