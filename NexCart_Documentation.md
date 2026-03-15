# NexCart Project Documentation

Generated on: 2026-03-13

## 1. Overview
NexCart is a full-stack e-commerce platform with a customer-facing storefront and an admin operations console. The project is split into a React (Vite) frontend and a Spring Boot backend, backed by a MySQL database. Authentication is handled via JWT stored in an HttpOnly cookie, and most API routes are protected by a custom authentication filter.

## 2. Repository Layout
- Frontend app: `nexcart`
- Backend app: `nexcartBackEnd`
- Additional dashboard template: `dashboard_import/react-admin-dashboard-master` (separate React project, not wired into the main NexCart app)

## 3. Tech Stack
### Frontend
- React 19 + Vite
- React Router
- Tailwind CSS (via `@tailwindcss/vite`) and custom CSS
- Axios and Fetch
- Recharts for analytics charts
- Framer Motion + Lottie for animations

### Backend
- Spring Boot 3.4 (Java 17)
- Spring Web + Spring Data JPA
- MySQL database
- JWT auth (jjwt)
- Razorpay payment integration
- JUnit tests

## 4. Running Locally
### 4.1 Backend (Spring Boot)
Prerequisites
- Java 17
- Maven (or use the included wrapper)
- MySQL running locally

Steps
1. Configure database connection in `nexcartBackEnd/src/main/resources/application.properties`.
2. Start the backend server:
   - Windows: `./mvnw.cmd spring-boot:run`
   - macOS/Linux: `./mvnw spring-boot:run`
3. The API runs on `http://localhost:9090`.

### 4.2 Frontend (React + Vite)
Prerequisites
- Node.js + npm

Steps
1. From `nexcart` run:
   - `npm install`
   - `npm run dev`
2. The app runs on `http://localhost:5174` by default.

## 5. Configuration and Secrets
Backend configuration lives in `nexcartBackEnd/src/main/resources/application.properties`.

Key settings
- `server.port=9090`
- `spring.datasource.url=jdbc:mysql://localhost:3306/nexcart...`
- `jwt.secret=...` (must be at least 64 bytes for HS512)
- `razorpay.key_id` and `razorpay.key_secret`
- `admin.bootstrap.*` (creates or resets the admin account on startup)

Security note
- The current file contains real credential values. For production, move secrets to environment variables and remove them from version control.

CORS
- Allowed frontend origins: `http://localhost:5174`, `http://localhost:5175`, `http://localhost:5176`.

## 6. Authentication and Authorization
- Login endpoint: `POST /api/auth/login`
- On success, the backend sets an HttpOnly cookie `authToken` (1 hour expiry).
- Custom filter `AuthenticationFilter` protects `/api/*` and `/admin/*` routes.
- Admin routes require role `ADMIN`.
- Public routes are limited to:
  - `POST /api/users/register`
  - `POST /api/auth/login`

## 7. Frontend Architecture
### 7.1 Entry Points
- App entry: `nexcart/src/main.jsx`
- Top-level app: `nexcart/src/App.jsx`

### 7.2 Routes
Customer routes
- `/` login
- `/register` registration
- `/home` or `/customerhome` home page
- `/products` product listing (same as home)
- `/product/:productId` product details
- `/UserCartPage` cart
- `/checkout` cart checkout
- `/orders` order history
- `/profile` profile
- `/wishlist` wishlist
- `/about` about page

Support routes
- `/support/customer-service`
- `/support/track-order`
- `/support/returns-refunds`
- `/support/help-center`
- `/support/contact-us`

Admin routes
- `/admin` admin login
- `/admindashboard` admin layout shell
- `/admindashboard/products`
- `/admindashboard/categories`
- `/admindashboard/orders`
- `/admindashboard/customers`
- `/admindashboard/coupons`
- `/admindashboard/analytics`
- `/admindashboard/support`
- `/admindashboard/settings`

### 7.3 Key UI Modules
- `components/layout`: Header, Footer, Logo, ThemeToggle
- `components/cart`: Cart icon + modal
- `components/navigation`: Category navigation
- `components/ui`: Toasts, skeleton loaders, notices, modal
- `admin/*`: Admin layout, pages, components, and services

### 7.4 Admin API Client
Frontend admin screens call backend APIs through:
- `nexcart/src/admin/services/adminApi.js`

This client handles:
- Products, categories, orders, customers
- Coupons and settings
- Support tickets and analytics
- Session expiry redirects to `/admin`

## 8. Backend API Reference
Base URL: `http://localhost:9090`

### 8.1 Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### 8.2 Users
- `POST /api/users/register`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/password`

### 8.3 Products
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/products/{id}/inventory`
- `GET /api/products/availability?ids=1,2,3`

### 8.4 Categories
- `GET /api/categories`

### 8.5 Cart
- `GET /api/cart/items`
- `GET /api/cart/items/count`
- `POST /api/cart/add`
- `PUT /api/cart/update`
- `DELETE /api/cart/delete`

### 8.6 Orders
- `GET /api/orders`
- `POST /api/orders/{orderId}/return-request`

### 8.7 Payments
- `POST /api/payment/create`
- `POST /api/payment/cod`
- `POST /api/payment/verify`

### 8.8 Coupons
- `POST /api/coupons/validate`
- `GET /api/store/coupons` (active coupons)

### 8.9 Reviews
- `GET /api/reviews/{productId}`
- `POST /api/reviews`

### 8.10 Support
- `GET /api/support/help-center`
- `GET /api/support/returns-policy`
- `GET /api/support/contact`
- `POST /api/support/tickets`
- `GET /api/support/tickets/my`
- `GET /api/support/tickets/my/{ticketNumber}`
- `GET /api/support/track-order/{orderId}`

### 8.11 Store Insights
- `GET /api/store/highlights`
- `GET /api/store/about`

### 8.12 System Settings (Customer Side)
- `GET /api/settings`
- `GET /api/settings/payment-methods`
- `PUT /api/settings` (admin only)

### 8.13 Admin APIs
Dashboard and analytics
- `GET /admin/dashboard/overview?days=14`

Business reports
- `GET /admin/business/daily?date=YYYY-MM-DD`
- `GET /admin/business/monthly?month=1&year=2026`
- `GET /admin/business/yearly?year=2026`
- `GET /admin/business/overall`

Products
- `POST /admin/products/add`
- `PUT /admin/products/update`
- `DELETE /admin/products/delete`

Categories
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories`
- `DELETE /admin/categories`

Orders
- `GET /admin/orders`
- `PUT /admin/orders/status`
- `PUT /admin/orders/return-status`

Users
- `GET /admin/users`
- `GET /admin/users/{id}`
- `DELETE /admin/users/{id}`
- `PUT /admin/users/{id}/block`
- `PUT /admin/users/{id}/unblock`
- `GET /admin/users/{id}/orders`
- `PUT /admin/user/modify`
- `PUT /admin/user/block`
- `GET /admin/user/all`
- `POST /admin/user/getbyid`

Coupons
- `GET /admin/coupons`
- `POST /admin/coupons`
- `PUT /admin/coupons/{id}`
- `PATCH /admin/coupons/{id}/status`
- `DELETE /admin/coupons/{id}`

Support
- `GET /admin/support/tickets?status=OPEN&q=...`
- `GET /admin/support/tickets/{ticketNumber}`
- `PUT /admin/support/tickets/{ticketNumber}`
- `GET /admin/support/overview`

Settings
- `GET /admin/settings`
- `PUT /admin/settings`

## 9. Data Model Summary
Main entities and key fields
- User: `userId`, `username`, `email`, `password`, `role`, `status`, `blocked`, `address`, `createdAt`
- Product: `productId`, `name`, `description`, `price`, `stock`, `productStatus`, `category`
- Category: `categoryId`, `categoryName`, `imageUrl`
- CartItem: `user`, `product`, `quantity`
- Order: `orderId`, `userId`, `subtotal`, `shipping`, `tax`, `total`, `status`, `paymentStatus`
- OrderItem: `order`, `productId`, `quantity`, `pricePerUnit`, `totalPrice`
- Payment: `orderId`, `razorpayPaymentId`, `status`, `amount`, `userId`
- Coupon: `code`, `discountType`, `discountValue`, `expiryDate`, `usageLimit`, `active`
- Review: `productId`, `userId`, `rating`, `comment`
- SupportTicket: `ticketNumber`, `userId`, `type`, `priority`, `status`, `subject`, `message`
- ReturnRequest: `orderId`, `productId`, `userId`, `requestType`, `status`, `refundStatus`
- SystemSetting: `settingKey`, `settingValue`

## 10. Database and Seed Data
Database scripts are provided under:
- `nexcartBackEnd/src/main/resources/db`

Key scripts
- `nexcart_schema.sql` (tables)
- `nexcart_seed.sql` (seed data)
- `nexcart_full_setup.sql` (full schema + seed)
- `nexcart_bulk_products.sql` (product bulk load)
- `nexcart_migration_20260310.sql` (migration)

The backend is also configured with:
- `spring.jpa.hibernate.ddl-auto=update`

## 11. User Guide (Customer)
### 11.1 Register and Login
1. Open the app at `http://localhost:5174`.
2. Choose Register to create a new account.
3. Login with your username and password.

### 11.2 Browse and Shop
1. Browse the home/products page.
2. Use category navigation or search.
3. Open a product to view details and reviews.
4. Add items to cart.

### 11.3 Checkout and Orders
1. Open cart.
2. Apply coupons if needed.
3. Choose payment method.
4. Place the order.
5. Track order status under Orders.

### 11.4 Returns and Support
1. Open Orders and request return for an item.
2. Use Support pages for help center, return policy, or contact.
3. Create a support ticket for issues.

## 12. Admin Guide
### 12.1 Admin Login
1. Open `http://localhost:5174/admin`.
2. Login with admin credentials.
3. You are redirected to `/admindashboard`.

### 12.2 Dashboard
The dashboard shows recent business metrics, orders, and key stats.

### 12.3 Manage Catalog
- Products: create, update, delete products and images.
- Categories: manage category list and images.

### 12.4 Manage Orders
- View order list
- Update status and tracking number
- Handle return requests and refunds

### 12.5 Manage Customers
- View users
- Block/unblock accounts
- Update roles and profile data

### 12.6 Coupons
- Create, update, disable, delete coupons

### 12.7 Support Tickets
- Review incoming tickets
- Update status and admin notes

### 12.8 Settings
- Configure store profile, payment methods, shipping, tax, security

## 13. Testing
Backend tests live in:
- `nexcartBackEnd/src/test/java`

Run tests
- `./mvnw.cmd test`

## 14. Build and Deployment
Frontend build
- `npm run build`
- Output: `nexcart/dist`

Backend build
- `./mvnw.cmd -DskipTests package`
- Output: `nexcartBackEnd/target/*.jar`

Deployment checklist
- Configure production database
- Set JWT secret and payment keys as environment variables
- Update allowed CORS origins

## 15. Troubleshooting
Common issues
- 401 Unauthorized: login cookie missing or expired.
- 403 Forbidden: user is blocked or not admin.
- CORS errors: frontend port not listed in allowed origins.
- JWT secret error: must be at least 64 bytes.
- Razorpay errors: verify keys and callback payload.

## 16. Security and Operational Notes
- Consider enabling HTTPS and secure cookies in production.
- Move secrets out of `application.properties`.
- Enable Spring Security for production hardening.
- Add rate limiting on auth and payment endpoints.

End of Document
