# NexCart API Documentation

## Base URLs
- Local API: `http://localhost:9090`

## Authentication
JWT is issued at `/api/auth/login` and stored as `authToken` HttpOnly cookie.

All `/api/*` and `/admin/*` endpoints are protected except the following public endpoints.
- `POST /api/users/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/captcha`

## Error Format
Most errors return a JSON object with an `error` or `message` field.
```json
{ "error": "User not authenticated" }
```

---

## Auth and Session

### POST /api/auth/login
Method: POST
Auth: Public
Request parameters: None
Request body:
```json
{ "username": "jane", "password": "Secret@123" }
```
Response: JSON with role and user identifiers
Example request:
```
POST /api/auth/login
```
Example response:
```json
{ "message": "Login successful", "role": "CUSTOMER", "username": "jane", "userId": 12 }
```
Error responses:
- 401 Invalid username or password

### POST /api/auth/logout
Method: POST
Auth: Required
Request parameters: None
Request body: None
Response: JSON message
Example request:
```
POST /api/auth/logout
```
Example response:
```json
{ "message": "Logout successful" }
```
Error responses:
- 500 Logout failed

### GET /api/auth/me
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: JSON user summary
Example request:
```
GET /api/auth/me
```
Example response:
```json
{ "userId": 12, "username": "jane", "email": "jane@example.com", "role": "CUSTOMER" }
```
Error responses:
- 401 User not authenticated

### GET /api/auth/captcha
Method: GET
Auth: Public
Request parameters: None
Request body: None
Response: Captcha question
Example request:
```
GET /api/auth/captcha
```
Example response:
```json
{ "captchaId": "<uuid>", "question": "What is 4 + 7 ?" }
```
Error responses:
- 500 Captcha generation failed

### POST /api/auth/forgot-password
Method: POST
Auth: Public
Request parameters: None
Request body:
```json
{ "identifier": "jane@example.com", "captchaId": "<uuid>", "captchaAnswer": "11" }
```
Response: JSON confirmation message
Example request:
```
POST /api/auth/forgot-password
```
Example response:
```json
{ "message": "If an account exists, a reset link will be sent." }
```
Error responses:
- 400 Captcha verification failed
- 429 Too many requests

### POST /api/auth/reset-password
Method: POST
Auth: Public
Request parameters: None
Request body:
```json
{ "token": "<reset-token>", "newPassword": "NewPass@123", "confirmPassword": "NewPass@123" }
```
Response: JSON message
Example request:
```
POST /api/auth/reset-password
```
Example response:
```json
{ "message": "Password reset successful" }
```
Error responses:
- 400 Invalid or expired reset token

---

## Users

### POST /api/users/register
Method: POST
Auth: Public
Request parameters: None
Request body:
```json
{ "username": "jane", "email": "jane@example.com", "password": "Secret@123" }
```
Response: JSON with created user
Example request:
```
POST /api/users/register
```
Example response:
```json
{ "message": "User registered successfully", "user": { "userId": 12, "username": "jane" } }
```
Error responses:
- 400 Validation or duplicate errors

### GET /api/users/profile
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: JSON user profile
Example request:
```
GET /api/users/profile
```
Example response:
```json
{ "userId": 12, "username": "jane", "email": "jane@example.com", "addressLine1": "Street 1" }
```
Error responses:
- 401 User not authenticated

### PUT /api/users/profile
Method: PUT
Auth: Required
Request parameters: None
Request body:
```json
{ "phone": "9999999999", "addressLine1": "Street 1", "city": "Pune" }
```
Response: JSON message and updated user
Example request:
```
PUT /api/users/profile
```
Example response:
```json
{ "message": "Profile updated successfully", "user": { "userId": 12, "username": "jane" } }
```
Error responses:
- 401 User not authenticated
- 400 Validation errors

### PUT /api/users/password
Method: PUT
Auth: Required
Request parameters: None
Request body:
```json
{ "currentPassword": "Secret@123", "newPassword": "NewPass@123", "confirmPassword": "NewPass@123" }
```
Response: JSON message
Example request:
```
PUT /api/users/password
```
Example response:
```json
{ "message": "Password updated successfully" }
```
Error responses:
- 401 User not authenticated
- 400 Password mismatch or invalid current password

---

## Products and Categories

### GET /api/products
Method: GET
Auth: Required
Request parameters:
- `category` optional
- `q` optional
- `page` optional, default 0
- `size` optional, default 24
Request body: None
Response: Product list with pagination
Example request:
```
GET /api/products?category=Shirts&q=men&page=0&size=24
```
Example response:
```json
{
  "user": { "username": "jane", "role": "CUSTOMER" },
  "products": [ { "productId": 1, "name": "Starter Shirt", "price": 499 } ],
  "pagination": { "page": 0, "size": 24, "totalPages": 3, "totalElements": 52 }
}
```
Error responses:
- 401 Unauthorized

### GET /api/products/{id}
Method: GET
Auth: Required
Request parameters: Path `id`
Request body: None
Response: Product detail
Example request:
```
GET /api/products/1
```
Example response:
```json
{ "productId": 1, "name": "Starter Shirt", "images": ["..."], "reviews": [] }
```
Error responses:
- 401 Unauthorized
- 404 Product not found

### GET /api/products/{id}/inventory
Method: GET
Auth: Required
Request parameters: Path `id`
Request body: None
Response: Inventory status
Example request:
```
GET /api/products/1/inventory
```
Example response:
```json
{ "productId": 1, "stock": 50, "product_status": "AVAILABLE" }
```
Error responses:
- 404 Product not found

### GET /api/products/availability
Method: GET
Auth: Required
Request parameters: `ids` as comma-separated list
Request body: None
Response: List of inventory statuses
Example request:
```
GET /api/products/availability?ids=1,2,3
```
Example response:
```json
{ "items": [ { "productId": 1, "stock": 50 }, { "productId": 2, "stock": 0 } ] }
```
Error responses:
- 500 Failed to load availability

### GET /api/categories
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Categories list
Example request:
```
GET /api/categories
```
Example response:
```json
{ "categories": [ { "categoryId": 1, "categoryName": "Shirts", "imageUrl": "..." } ] }
```
Error responses:
- 500 Failed to load categories

---

## Cart

### GET /api/cart/items
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Cart items and totals
Example request:
```
GET /api/cart/items
```
Example response:
```json
{ "username": "jane", "cart": { "products": [ { "product_id": 1, "quantity": 2 } ], "overall_total_price": 998 } }
```
Error responses:
- 401 User not authenticated

### GET /api/cart/items/count
Method: GET
Auth: Required
Request parameters: `username` optional
Request body: None
Response: Integer count
Example request:
```
GET /api/cart/items/count
```
Example response:
```json
2
```
Error responses:
- 400 Missing user

### POST /api/cart/add
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "productId": 1, "quantity": 2 }
```
Response: JSON message
Example request:
```
POST /api/cart/add
```
Example response:
```json
{ "message": "Item added to cart" }
```
Error responses:
- 409 Insufficient stock

### PUT /api/cart/update
Method: PUT
Auth: Required
Request parameters: None
Request body:
```json
{ "productId": 1, "quantity": 3 }
```
Response: JSON message
Example request:
```
PUT /api/cart/update
```
Example response:
```json
{ "message": "Cart updated" }
```
Error responses:
- 409 Insufficient stock

### DELETE /api/cart/delete
Method: DELETE
Auth: Required
Request parameters: None
Request body:
```json
{ "productId": 1 }
```
Response: 204 No Content
Example request:
```
DELETE /api/cart/delete
```
Example response:
```
204 No Content
```
Error responses:
- 400 Invalid request

---

## Orders and Returns

### GET /api/orders
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Order history
Example request:
```
GET /api/orders
```
Example response:
```json
{ "username": "jane", "products": [ { "order_id": "COD_...", "status": "CONFIRMED" } ] }
```
Error responses:
- 401 User not authenticated

### POST /api/orders/{orderId}/return-request
Method: POST
Auth: Required
Request parameters: Path `orderId`
Request body:
```json
{ "productId": 10, "reason": "Damaged item", "requestType": "RETURN" }
```
Response: Return request info
Example request:
```
POST /api/orders/COD_123/return-request
```
Example response:
```json
{ "message": "Request submitted", "returnStatus": "REQUESTED" }
```
Error responses:
- 400 Return not allowed or product not in order

---

## Payments

### POST /api/payment/create
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "discountAmount": 100, "couponCode": "SAVE10", "shippingAddress": "Street 1", "shippingCountry": "India", "paymentMethod": "RAZORPAY", "cartItems": [ { "productId": 1, "quantity": 2, "price": 499 } ] }
```
Response: Razorpay order info
Example request:
```
POST /api/payment/create
```
Example response:
```json
{ "orderId": "order_...", "amount": 109800, "total": 1098.00 }
```
Error responses:
- 400 Invalid request data

### POST /api/payment/cod
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "discountAmount": 0, "cartItems": [ { "productId": 1, "quantity": 1, "price": 499 } ] }
```
Response: COD order info
Example request:
```
POST /api/payment/cod
```
Example response:
```json
{ "orderId": "COD_...", "subtotal": 499.00, "total": 499.00 }
```
Error responses:
- 409 Insufficient stock

### POST /api/payment/verify
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "razorpayOrderId": "order_...", "razorpayPaymentId": "pay_...", "razorpaySignature": "..." }
```
Response: Plain text success or error
Example request:
```
POST /api/payment/verify
```
Example response:
```
Payment verified successfully
```
Error responses:
- 400 Verification failed
- 409 Stock issues

---

## Coupons

### POST /api/coupons/validate
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "code": "SAVE10", "subtotal": 1200 }
```
Response: Coupon validation result
Example request:
```
POST /api/coupons/validate
```
Example response:
```json
{ "code": "SAVE10", "discountAmount": 120, "discountType": "PERCENTAGE" }
```
Error responses:
- 400 Coupon invalid or expired

---

## Reviews

### GET /api/reviews/{productId}
Method: GET
Auth: Required
Request parameters: Path `productId`
Request body: None
Response: Review list
Example request:
```
GET /api/reviews/1
```
Example response:
```json
[ { "userId": 12, "rating": 5, "comment": "Great" } ]
```
Error responses:
- 500 Failed to load reviews

### POST /api/reviews
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "productId": 1, "rating": 5, "comment": "Great" }
```
Response: Review object
Example request:
```
POST /api/reviews
```
Example response:
```json
{ "id": 22, "productId": 1, "rating": 5, "comment": "Great" }
```
Error responses:
- 400 Invalid rating or product

---

## Store and Settings

### GET /api/store/highlights
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Store highlights
Example request:
```
GET /api/store/highlights
```
Example response:
```json
{ "deliveryEstimate": "24h dispatch", "activeOfferCount": 2, "paymentMethods": ["Razorpay", "Cash on Delivery"] }
```
Error responses:
- 500 Failed to load highlights

### GET /api/store/about
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Store stats
Example request:
```
GET /api/store/about
```
Example response:
```json
{ "activeShoppers": 1200, "productSkus": 250, "orderSuccessRate": 98.5 }
```
Error responses:
- 500 Failed to load stats

### GET /api/store/coupons
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Active coupons
Example request:
```
GET /api/store/coupons
```
Example response:
```json
{ "coupons": [ { "code": "SAVE10", "discountValue": 10 } ] }
```
Error responses:
- 500 Failed to load coupons

### GET /api/settings
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Public settings
Example request:
```
GET /api/settings
```
Example response:
```json
{ "shipping": { "freeShippingMin": 999 }, "tax": { "gstPercentage": 18 }, "payment": { "razorpay": true } }
```
Error responses:
- 500 Failed to load settings

### GET /api/settings/payment-methods
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Payment method flags
Example request:
```
GET /api/settings/payment-methods
```
Example response:
```json
{ "razorpay": true, "cod": true, "stripe": false, "paypal": false }
```
Error responses:
- 500 Failed to load payment methods

### PUT /api/settings
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "tax_enabled": "true", "gst_percentage": "18" }
```
Response: JSON message
Example request:
```
PUT /api/settings
```
Example response:
```json
{ "message": "Settings updated" }
```
Error responses:
- 403 Admin access required

---

## Support

### GET /api/support/help-center
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Help center content
Example request:
```
GET /api/support/help-center
```
Example response:
```json
{ "topics": [ { "title": "Orders & Tracking", "items": ["..."] } ] }
```
Error responses:
- 500 Unable to load help center

### GET /api/support/returns-policy
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Returns policy content
Example request:
```
GET /api/support/returns-policy
```
Example response:
```json
{ "window": "7-day easy returns on eligible products", "steps": ["..."] }
```
Error responses:
- 500 Unable to load returns policy

### GET /api/support/contact
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: Contact info
Example request:
```
GET /api/support/contact
```
Example response:
```json
{ "email": "support@nexcart.com", "phone": "+91 9988776655" }
```
Error responses:
- 500 Unable to load contact info

### POST /api/support/tickets
Method: POST
Auth: Required
Request parameters: None
Request body:
```json
{ "subject": "Order delayed", "message": "My order is late", "priority": "HIGH" }
```
Response: Ticket details
Example request:
```
POST /api/support/tickets
```
Example response:
```json
{ "ticketNumber": "SUP-ABCDE12345", "status": "OPEN" }
```
Error responses:
- 400 Validation errors

### GET /api/support/tickets/my
Method: GET
Auth: Required
Request parameters: None
Request body: None
Response: List of tickets
Example request:
```
GET /api/support/tickets/my
```
Example response:
```json
[ { "ticketNumber": "SUP-ABCDE12345", "status": "OPEN" } ]
```
Error responses:
- 500 Unable to load tickets

### GET /api/support/tickets/my/{ticketNumber}
Method: GET
Auth: Required
Request parameters: Path `ticketNumber`
Request body: None
Response: Ticket details
Example request:
```
GET /api/support/tickets/my/SUP-ABCDE12345
```
Example response:
```json
{ "ticketNumber": "SUP-ABCDE12345", "status": "OPEN" }
```
Error responses:
- 404 Ticket not found

### GET /api/support/track-order/{orderId}
Method: GET
Auth: Required
Request parameters: Path `orderId`
Request body: None
Response: Order tracking summary
Example request:
```
GET /api/support/track-order/COD_123
```
Example response:
```json
{ "orderId": "COD_123", "status": "SHIPPED", "products": [ { "productId": 1, "quantity": 1 } ] }
```
Error responses:
- 404 Order not found

---

## Admin APIs

### GET /admin/dashboard/overview
Method: GET
Auth: Admin only
Request parameters: `days` optional
Request body: None
Response: KPI overview
Example request:
```
GET /admin/dashboard/overview?days=14
```
Example response:
```json
{ "kpis": { "orders": 120 }, "products": [ { "productId": 1, "name": "Starter Shirt" } ] }
```
Error responses:
- 500 Failed to load dashboard

### GET /admin/business/daily
Method: GET
Auth: Admin only
Request parameters: `date` in YYYY-MM-DD
Request body: None
Response: Daily business report
Example request:
```
GET /admin/business/daily?date=2026-03-15
```
Example response:
```json
{ "date": "2026-03-15", "orders": 12, "revenue": 21990.00 }
```
Error responses:
- 400 Invalid date

### GET /admin/business/monthly
Method: GET
Auth: Admin only
Request parameters: `month` 1-12, `year` YYYY
Request body: None
Response: Monthly business report
Example request:
```
GET /admin/business/monthly?month=3&year=2026
```
Example response:
```json
{ "month": 3, "year": 2026, "orders": 320, "revenue": 512000.00 }
```
Error responses:
- 400 Invalid month or year

### GET /admin/business/yearly
Method: GET
Auth: Admin only
Request parameters: `year` YYYY
Request body: None
Response: Yearly business report
Example request:
```
GET /admin/business/yearly?year=2026
```
Example response:
```json
{ "year": 2026, "orders": 3800, "revenue": 6200000.00 }
```
Error responses:
- 400 Invalid year

### GET /admin/business/overall
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Overall business summary
Example request:
```
GET /admin/business/overall
```
Example response:
```json
{ "orders": 5000, "revenue": 8200000.00 }
```
Error responses:
- 500 Something went wrong while calculating overall business

### POST /admin/products/add
Method: POST
Auth: Admin only
Request parameters: None
Request body:
```json
{ "name": "Shirt", "description": "...", "price": 499, "stock": 50, "categoryId": 1, "imageUrls": ["..."] }
```
Response: Product creation status
Example request:
```
POST /admin/products/add
```
Example response:
```json
{ "message": "Product created successfully", "productId": 10 }
```
Error responses:
- 400 Validation errors

### PUT /admin/products/update
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "productId": 10, "name": "Updated Shirt", "stock": 40 }
```
Response: Update status
Example request:
```
PUT /admin/products/update
```
Example response:
```json
{ "message": "Product updated successfully", "productId": 10 }
```
Error responses:
- 400 Invalid product

### DELETE /admin/products/delete
Method: DELETE
Auth: Admin only
Request parameters: None
Request body:
```json
{ "productId": 10 }
```
Response: JSON message
Example request:
```
DELETE /admin/products/delete
```
Example response:
```json
{ "message": "Product deleted successfully" }
```
Error responses:
- 404 Product not found

### GET /admin/categories
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Category list
Example request:
```
GET /admin/categories
```
Example response:
```json
[ { "categoryId": 1, "categoryName": "Shirts" } ]
```
Error responses:
- 500 Failed to load categories

### POST /admin/categories
Method: POST
Auth: Admin only
Request parameters: None
Request body:
```json
{ "categoryName": "Shoes", "imageUrl": "..." }
```
Response: Category object
Example request:
```
POST /admin/categories
```
Example response:
```json
{ "categoryId": 3, "categoryName": "Shoes" }
```
Error responses:
- 400 Validation errors

### PUT /admin/categories
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "categoryId": 3, "categoryName": "Accessories" }
```
Response: Category object
Example request:
```
PUT /admin/categories
```
Example response:
```json
{ "categoryId": 3, "categoryName": "Accessories" }
```
Error responses:
- 400 Invalid category

### DELETE /admin/categories
Method: DELETE
Auth: Admin only
Request parameters: None
Request body:
```json
{ "categoryId": 3 }
```
Response: JSON message
Example request:
```
DELETE /admin/categories
```
Example response:
```json
{ "message": "Category deleted successfully" }
```
Error responses:
- 400 Invalid category

### GET /admin/orders
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Order list
Example request:
```
GET /admin/orders
```
Example response:
```json
[ { "orderId": "COD_123", "orderStatus": "CONFIRMED" } ]
```
Error responses:
- 500 Failed to load orders

### PUT /admin/orders/status
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "orderId": "COD_123", "status": "SHIPPED", "trackingNumber": "TRACK123" }
```
Response: Updated order summary
Example request:
```
PUT /admin/orders/status
```
Example response:
```json
{ "orderId": "COD_123", "status": "SHIPPED", "trackingNumber": "TRACK123" }
```
Error responses:
- 400 Invalid status

### PUT /admin/orders/return-status
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "orderId": "COD_123", "productId": 10, "status": "APPROVED", "refundAmount": 499 }
```
Response: Updated return summary
Example request:
```
PUT /admin/orders/return-status
```
Example response:
```json
{ "orderId": "COD_123", "status": "APPROVED" }
```
Error responses:
- 400 Invalid return request

### GET /admin/users
Method: GET
Auth: Admin only
Request parameters: `q`, `status`, `page`, `size`
Request body: None
Response: User list or paged response
Example request:
```
GET /admin/users?status=ACTIVE&page=1&size=10
```
Example response:
```json
{ "data": [ { "userId": 12, "username": "jane" } ], "pagination": { "page": 1, "size": 10, "totalPages": 2 } }
```
Error responses:
- 500 Failed to load users

### GET /admin/users/{id}
Method: GET
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: User summary
Example request:
```
GET /admin/users/12
```
Example response:
```json
{ "userId": 12, "username": "jane", "role": "CUSTOMER" }
```
Error responses:
- 404 User not found

### DELETE /admin/users/{id}
Method: DELETE
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: JSON message
Example request:
```
DELETE /admin/users/12
```
Example response:
```json
{ "message": "User deleted" }
```
Error responses:
- 404 User not found

### PUT /admin/users/{id}/block
Method: PUT
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: Updated user summary
Example request:
```
PUT /admin/users/12/block
```
Example response:
```json
{ "userId": 12, "blocked": true }
```
Error responses:
- 404 User not found

### PUT /admin/users/{id}/unblock
Method: PUT
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: Updated user summary
Example request:
```
PUT /admin/users/12/unblock
```
Example response:
```json
{ "userId": 12, "blocked": false }
```
Error responses:
- 404 User not found

### GET /admin/users/{id}/orders
Method: GET
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: Order history for user
Example request:
```
GET /admin/users/12/orders
```
Example response:
```json
[ { "orderId": "COD_123", "orderStatus": "CONFIRMED" } ]
```
Error responses:
- 500 Failed to load order history

### POST /admin/users/{id}/reset-password
Method: POST
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: JSON message
Example request:
```
POST /admin/users/12/reset-password
```
Example response:
```json
{ "message": "Password reset link sent." }
```
Error responses:
- 404 User not found

### PUT /admin/user/modify
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "userId": 12, "username": "jane", "email": "jane@example.com", "role": "CUSTOMER" }
```
Response: Updated user summary
Example request:
```
PUT /admin/user/modify
```
Example response:
```json
{ "userId": 12, "username": "jane" }
```
Error responses:
- 400 Invalid user data

### PUT /admin/user/block
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "userId": 12, "blocked": true }
```
Response: Updated user summary
Example request:
```
PUT /admin/user/block
```
Example response:
```json
{ "userId": 12, "blocked": true }
```
Error responses:
- 400 Invalid user data

### GET /admin/user/all
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: List of all users
Example request:
```
GET /admin/user/all
```
Example response:
```json
[ { "userId": 12, "username": "jane" } ]
```
Error responses:
- 500 Something went wrong

### POST /admin/user/getbyid
Method: POST
Auth: Admin only
Request parameters: None
Request body:
```json
{ "userId": 12 }
```
Response: User summary
Example request:
```
POST /admin/user/getbyid
```
Example response:
```json
{ "userId": 12, "username": "jane" }
```
Error responses:
- 404 User not found

### GET /admin/coupons
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Coupon list
Example request:
```
GET /admin/coupons
```
Example response:
```json
[ { "id": 1, "code": "SAVE10", "active": true } ]
```
Error responses:
- 500 Failed to load coupons

### POST /admin/coupons
Method: POST
Auth: Admin only
Request parameters: None
Request body:
```json
{ "code": "SAVE10", "discountType": "PERCENTAGE", "discountValue": 10, "usageLimit": 100, "expiryDate": "2026-12-31" }
```
Response: Coupon object
Example request:
```
POST /admin/coupons
```
Example response:
```json
{ "id": 1, "code": "SAVE10", "active": true }
```
Error responses:
- 400 Invalid coupon

### PUT /admin/coupons/{id}
Method: PUT
Auth: Admin only
Request parameters: Path `id`
Request body:
```json
{ "code": "SAVE10", "discountType": "PERCENTAGE", "discountValue": 12 }
```
Response: Coupon object
Example request:
```
PUT /admin/coupons/1
```
Example response:
```json
{ "id": 1, "code": "SAVE10", "discountValue": 12 }
```
Error responses:
- 400 Invalid coupon

### PATCH /admin/coupons/{id}/status
Method: PATCH
Auth: Admin only
Request parameters: Path `id`
Request body:
```json
{ "active": false }
```
Response: Coupon object
Example request:
```
PATCH /admin/coupons/1/status
```
Example response:
```json
{ "id": 1, "active": false }
```
Error responses:
- 400 Invalid coupon

### DELETE /admin/coupons/{id}
Method: DELETE
Auth: Admin only
Request parameters: Path `id`
Request body: None
Response: JSON message
Example request:
```
DELETE /admin/coupons/1
```
Example response:
```json
{ "message": "Coupon deleted" }
```
Error responses:
- 404 Coupon not found

### GET /admin/settings
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Grouped settings
Example request:
```
GET /admin/settings
```
Example response:
```json
{ "store": { "storeName": "NexCart" }, "payment": { "razorpay": true } }
```
Error responses:
- 500 Failed to load settings

### PUT /admin/settings
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "store": { "storeName": "NexCart" }, "payment": { "razorpay": true } }
```
Response: JSON message
Example request:
```
PUT /admin/settings
```
Example response:
```json
{ "message": "Settings updated" }
```
Error responses:
- 400 Invalid payload

### GET /admin/settings/email-templates/reset
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Reset email template
Example request:
```
GET /admin/settings/email-templates/reset
```
Example response:
```json
{ "template": "<html>...</html>" }
```
Error responses:
- 500 Failed to load template

### PUT /admin/settings/email-templates/reset
Method: PUT
Auth: Admin only
Request parameters: None
Request body:
```json
{ "template": "<html>...</html>" }
```
Response: Updated template
Example request:
```
PUT /admin/settings/email-templates/reset
```
Example response:
```json
{ "template": "<html>...</html>" }
```
Error responses:
- 400 Invalid template

### GET /admin/support/tickets
Method: GET
Auth: Admin only
Request parameters: `status`, `q`
Request body: None
Response: Ticket list
Example request:
```
GET /admin/support/tickets?status=OPEN&q=refund
```
Example response:
```json
[ { "ticketNumber": "SUP-ABCDE12345", "status": "OPEN" } ]
```
Error responses:
- 500 Failed to load support tickets

### GET /admin/support/tickets/{ticketNumber}
Method: GET
Auth: Admin only
Request parameters: Path `ticketNumber`
Request body: None
Response: Ticket details
Example request:
```
GET /admin/support/tickets/SUP-ABCDE12345
```
Example response:
```json
{ "ticketNumber": "SUP-ABCDE12345", "status": "OPEN" }
```
Error responses:
- 404 Ticket not found

### PUT /admin/support/tickets/{ticketNumber}
Method: PUT
Auth: Admin only
Request parameters: Path `ticketNumber`
Request body:
```json
{ "status": "RESOLVED", "adminNote": "Resolved" }
```
Response: Updated ticket
Example request:
```
PUT /admin/support/tickets/SUP-ABCDE12345
```
Example response:
```json
{ "ticketNumber": "SUP-ABCDE12345", "status": "RESOLVED" }
```
Error responses:
- 400 Invalid status

### GET /admin/support/overview
Method: GET
Auth: Admin only
Request parameters: None
Request body: None
Response: Support overview
Example request:
```
GET /admin/support/overview
```
Example response:
```json
{ "openTickets": 12, "resolvedTickets": 140 }
```
Error responses:
- 500 Failed to load support overview

### GET /admin/support/reset-logs
Method: GET
Auth: Admin only
Request parameters: `q`, `action`, `from`, `to`
Request body: None
Response: Reset audit logs
Example request:
```
GET /admin/support/reset-logs?action=forgot_password_sent
```
Example response:
```json
[ { "action": "forgot_password_sent", "identifier": "jane@example.com" } ]
```
Error responses:
- 500 Failed to load reset logs

### GET /admin/support/reset-logs/export
Method: GET
Auth: Admin only
Request parameters: `q`, `action`, `from`, `to`
Request body: None
Response: CSV download
Example request:
```
GET /admin/support/reset-logs/export
```
Example response:
```
action,identifier,ipAddress,createdAt
forgot_password_sent,jane@example.com,127.0.0.1,2026-03-16T10:30:00
```
Error responses:
- 500 Failed to export reset logs
