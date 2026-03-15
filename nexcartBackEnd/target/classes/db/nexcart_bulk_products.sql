-- Bulk product import for NexCart
-- temp table for bulk insert
DROP TEMPORARY TABLE IF EXISTS tmp_product_import;
CREATE TEMPORARY TABLE tmp_product_import (
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL,
  image_url TEXT
);

INSERT INTO tmp_product_import (name, description, category_name, price, stock_quantity, image_url) VALUES
('Classic White Shirt','Premium cotton formal shirt for office wear','Shirts',899,120,'https://images.unsplash.com/photo-1602810319428-019690571b5b?w=800'),
('Blue Casual Denim Shirt','Stylish denim shirt for casual outings','Shirts',999,100,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'),
('Checked Cotton Shirt','Comfortable cotton checked shirt','Shirts',799,150,'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'),
('Black Slim Shirt','Modern slim fit black shirt','Shirts',1099,90,'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800'),
('Linen Summer Shirt','Breathable linen shirt perfect for summer','Shirts',1199,70,'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'),

('Slim Fit Blue Jeans','Stretchable slim fit denim jeans','Pants',1299,100,'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'),
('Black Formal Trouser','Elegant formal office trousers','Pants',1199,80,'https://images.unsplash.com/photo-1593032465171-8f3b7c1b6f9c?w=800'),
('Cargo Utility Pants','Casual cargo pants with pockets','Pants',1399,70,'https://images.unsplash.com/photo-1506629905607-d405b7a70db0?w=800'),
('Grey Chinos','Comfortable chinos for casual wear','Pants',1099,110,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'),
('Jogger Pants','Sport style jogger pants','Pants',999,95,'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=800'),

('Leather Wrist Watch','Premium leather strap watch','Accessories',1999,80,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'),
('Stylish Sunglasses','UV protected fashion sunglasses','Accessories',899,140,'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800'),
('Leather Wallet','Premium leather wallet','Accessories',699,200,'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'),
('Silver Bracelet','Elegant metal bracelet','Accessories',599,130,'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800'),
('Designer Belt','High quality leather belt','Accessories',799,160,'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800'),

('Smartphone Ultra X','High performance smartphone','Mobiles',35999,40,'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'),
('Android Pro Max','Premium android smartphone','Mobiles',29999,35,'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'),
('Budget Smart Phone','Affordable smartphone','Mobiles',14999,90,'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800'),
('Gaming Smartphone','High performance gaming phone','Mobiles',42999,25,'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800'),
('Camera Pro Phone','Smartphone with advanced camera','Mobiles',38999,30,'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800'),

('Wireless Earbuds','Bluetooth earbuds with noise cancellation','Mobile Accessories',1999,200,'https://images.unsplash.com/photo-1585386959984-a41552231658?w=800'),
('Fast Charging Power Bank','10000mAh fast charging power bank','Mobile Accessories',1299,160,'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800'),
('Magnetic Phone Holder','Strong magnetic car phone holder','Mobile Accessories',499,300,'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'),
('USB Type C Charger','Fast charging USB type C adapter','Mobile Accessories',799,220,'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800'),
('Premium Phone Case','Shockproof mobile cover','Mobile Accessories',399,350,'https://images.unsplash.com/photo-1601593346740-925612772716?w=800'),

('Wireless Charging Pad','Fast wireless charger','Mobile Accessories',1499,110,'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800'),
('Gaming Earphones','Deep bass gaming earphones','Mobile Accessories',899,180,'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'),
('Phone Tripod Stand','Adjustable tripod stand','Mobile Accessories',699,95,'https://images.unsplash.com/photo-1580894894513-fc8a0e64a11c?w=800'),
('Laptop Backpack','Stylish laptop backpack','Accessories',1299,140,'https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=800'),
('Sports Watch','Digital sports watch','Accessories',1499,85,'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800'),

('Slim Blue Shirt','Modern slim blue shirt','Shirts',899,100,'https://images.unsplash.com/photo-1520975928318-5c4f1c1fbbd4?w=800'),
('Grey Casual Shirt','Comfortable grey casual shirt','Shirts',899,120,'https://images.unsplash.com/photo-1521335629791-ce4aec67dd53?w=800'),
('Formal Office Shirt','Professional office shirt','Shirts',1099,80,'https://images.unsplash.com/photo-1544441893-675973e31985?w=800'),
('Striped Shirt','Stylish striped shirt','Shirts',999,75,'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=800'),
('Cotton Summer Shirt','Lightweight summer shirt','Shirts',799,110,'https://images.unsplash.com/photo-1520974735194-5f1d8a59c99c?w=800'),

('Dark Blue Jeans','Comfortable dark blue denim','Pants',1399,90,'https://images.unsplash.com/photo-1516822003754-cca485356ecb?w=800'),
('Black Skinny Jeans','Modern skinny jeans','Pants',1499,85,'https://images.unsplash.com/photo-1506629905607-d405b7a70db0?w=800'),
('Stretch Fit Jeans','Flexible stretch denim','Pants',1299,95,'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800'),
('Casual Chino Pants','Smart casual chino pants','Pants',1199,120,'https://images.unsplash.com/photo-1592878849122-5a0b2f6b6c0e?w=800'),
('Slim Office Trouser','Slim fit office trouser','Pants',1099,100,'https://images.unsplash.com/photo-1562158070-622a97cdbd6c?w=800'),

('Classic Sunglasses','Premium stylish sunglasses','Accessories',799,130,'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800'),
('Luxury Bracelet','Premium metal bracelet','Accessories',899,90,'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'),
('Minimal Watch','Minimalist watch design','Accessories',1599,75,'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'),
('Fashion Wallet','Stylish wallet for men','Accessories',599,200,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'),
('Premium Belt','High quality belt','Accessories',799,120,'https://images.unsplash.com/photo-1585386959984-a41552231658?w=800'),

('Budget Android Phone','Affordable android smartphone','Mobiles',12999,100,'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800'),
('Gaming Android Phone','Gaming optimized smartphone','Mobiles',39999,35,'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800'),
('Flagship Phone','Premium flagship smartphone','Mobiles',49999,20,'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'),
('Pro Camera Phone','Smartphone with pro camera','Mobiles',41999,25,'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800'),
('Long Battery Phone','Phone with long battery life','Mobiles',18999,60,'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'),

('USB Cable','Durable charging cable','Mobile Accessories',299,500,'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800'),
('Phone Stand','Adjustable desk phone stand','Mobile Accessories',399,200,'https://images.unsplash.com/photo-1580894894513-fc8a0e64a11c?w=800'),
('Wireless Headphones','Premium wireless headphones','Mobile Accessories',2499,150,'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=800'),
('Car Charger','Dual USB car charger','Mobile Accessories',499,300,'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'),
('Phone Holder','360 degree rotating holder','Mobile Accessories',349,350,'https://images.unsplash.com/photo-1601593346740-925612772716?w=800');

INSERT INTO categories (category_name)
SELECT DISTINCT category_name FROM tmp_product_import
WHERE category_name NOT IN (SELECT category_name FROM categories);

INSERT INTO products (name, description, price, stock_quantity, category_id, created_at, updated_at, product_status)
SELECT
  t.name,
  t.description,
  t.price,
  t.stock_quantity,
  c.category_id,
  NOW(),
  NOW(),
  CASE WHEN t.stock_quantity > 0 THEN 'AVAILABLE' ELSE 'OUT_OF_STOCK' END
FROM tmp_product_import t
JOIN categories c ON c.category_name = t.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  WHERE p.name = t.name AND p.category_id = c.category_id
);

INSERT INTO productimages (product_id, image_url)
SELECT p.product_id, t.image_url
FROM tmp_product_import t
JOIN categories c ON c.category_name = t.category_name
JOIN products p ON p.name = t.name AND p.category_id = c.category_id
WHERE t.image_url IS NOT NULL AND t.image_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM productimages pi
    WHERE pi.product_id = p.product_id AND pi.image_url = t.image_url
  );
