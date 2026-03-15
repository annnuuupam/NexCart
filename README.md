# NexCart – Full Stack E-Commerce Platform

NexCart is a full-stack e-commerce platform designed to provide a complete online shopping experience.  
It includes a **customer storefront**, **secure checkout**, and an **admin dashboard** for managing products, orders, users, and support operations.

The **frontend** is built with **React (Vite)** and the **backend** uses **Spring Boot with JPA/Hibernate**, connected to a **MySQL database**.

The system supports:

- JWT authentication using HTTP-only cookies
- Razorpay payment integration
- Coupon validation
- Order tracking
- Return and refund workflows
- Admin analytics dashboard

---

# Tech Stack

## Frontend
- React 19
- React Router 7
- Vite
- Tailwind CSS
- Axios
- Recharts
- Framer Motion
- Lucide Icons

## Backend
- Spring Boot 3.4
- Spring Web
- Spring Data JPA
- JWT Authentication (JJWT)
- BCrypt Password Hashing
- Razorpay Java SDK

## Database
- MySQL

## Tools
- Maven
- Node.js
- npm

---

# Project Structure

```
NexCart/
│
├── NexCartFrontend/           # React Frontend (Customer + Admin UI)
│   └── src/
│       ├── pages/             # Customer and Admin pages
│       ├── components/        # Reusable UI components
│       ├── admin/             # Admin layout, services and features
│       └── routes/            # Application routing
│
└── nexcartBackEnd/            # Spring Boot Backend
    └── src/main/
        ├── java/              # Controllers, Services, Entities
        └── resources/
            └── db/            # SQL schema, seed data, migrations
```

---

# System Architecture

```mermaid
flowchart LR
  UI["React SPA (Vite)"] -->|REST API| API["Spring Boot Controllers"]
  API --> SVC["Service Layer"]
  SVC --> JPA["JPA Repositories"]
  JPA --> DB["MySQL Database"]
  API --> PAY["Razorpay Payment Gateway"]
```

---

# Authentication Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Enter login credentials
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate user credentials
  DB-->>BE: User record
  BE-->>FE: Set HTTP-only JWT cookie
  FE->>BE: Request protected API
  BE->>BE: Validate JWT token
  BE-->>FE: Return protected resource
```

---

# Checkout Workflow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant RP as Razorpay
  participant DB as MySQL

  U->>FE: Add product to cart
  FE->>BE: POST /api/cart/add
  BE->>DB: Validate stock + update cart

  U->>FE: Checkout
  FE->>BE: POST /api/payment/create
  BE->>RP: Create payment order

  RP-->>BE: order_id
  BE-->>FE: order_id + total amount

  FE->>RP: Complete payment
  FE->>BE: POST /api/payment/verify

  BE->>DB: Save order details
  BE->>DB: Reduce product stock
  BE->>DB: Clear cart

  BE-->>FE: Payment successful
```

---

# Features

## Customer Features
- User registration and login with JWT authentication
- Product listing with search, filters, and pagination
- Product detail page with reviews
- Shopping cart with stock validation
- Secure checkout process
- Razorpay payment gateway integration
- Cash on Delivery (COD) option
- Order tracking
- Invoice view and download
- Return and refund request system

## Admin Features
- Admin dashboard with business analytics
- Product and category management
- Order and return management
- User management
- Coupon and promotion management
- Customer support ticket system
- Store configuration and settings

---

# Installation Guide

## Backend Setup (Spring Boot)

1. Navigate to backend folder

```
cd nexcartBackEnd
```

2. Configure database and secrets in

```
src/main/resources/application.properties
```

3. Run backend server

```
./mvnw spring-boot:run
```

Backend runs at

```
http://localhost:9090
```

---

## Frontend Setup (React)

1. Navigate to frontend folder

```
cd NexCartFrontend
```

2. Install dependencies

```
npm install
```

3. Start development server

```
npm run dev
```

Frontend runs at

```
http://localhost:5174
```

---

# Usage

1. Open the application

```
http://localhost:5174
```

2. Register or login as a customer.

3. Admin users can access the admin panel

```
/admin
```

Admin bootstrap credentials are available in

```
nexcartBackEnd/src/main/resources/application.properties
```

---

# API Overview

All APIs are served from

```
http://localhost:9090
```

## Customer APIs

```
POST /api/auth/login
GET /api/products
POST /api/cart/add
POST /api/payment/create
POST /api/payment/verify
```

## Admin APIs

```
GET  /admin/dashboard/overview
POST /admin/products/add
PUT  /admin/orders/status
GET  /admin/support/tickets
```

---

# Database Schema

```mermaid
erDiagram
  USERS ||--o{ ORDERS : places
  USERS ||--o{ CART_ITEMS : has
  CATEGORIES ||--o{ PRODUCTS : contains
  PRODUCTS ||--o{ PRODUCTIMAGES : has
  ORDERS ||--o{ ORDER_ITEMS : includes
  PRODUCTS ||--o{ ORDER_ITEMS : ordered_as
  ORDERS ||--o{ PAYMENTS : paid_by
  ORDERS ||--o{ RETURNS : may_have
```

---

# Admin Dashboard Overview

```mermaid
flowchart TD
  A["Admin Login"] --> B["Dashboard KPIs"]
  B --> C["Products & Categories"]
  B --> D["Orders & Returns"]
  B --> E["Users & Access Control"]
  B --> F["Coupons & Promotions"]
  B --> G["Support Tickets"]
  B --> H["Store Settings"]
```

---

# Application Workflow

1. User logs in and receives a JWT authentication cookie  
2. Frontend fetches products and categories  
3. User adds items to cart  
4. System validates stock availability  
5. Checkout calculates tax, shipping, and coupons  
6. User selects Razorpay or COD payment  
7. Payment verification confirms order  
8. System updates inventory and clears cart  
9. User can track orders and request returns  

---

# Workflow Diagram

```mermaid
flowchart TD
  A["Login"] --> B["Browse Products"]
  B --> C["Add to Cart"]
  C --> D["Apply Coupon"]
  D --> E["Checkout"]
  E --> F{"Payment Method"}
  F -->|Razorpay| G["Create Payment Order"]
  F -->|COD| H["Place COD Order"]
  G --> I["Verify Payment"]
  I --> J["Save Order + Items"]
  H --> J
  J --> K["Update Stock + Clear Cart"]
  K --> L["Order Tracking + Returns"]
```

---

# Payment Verification Flow

```mermaid
sequenceDiagram
  participant FE as React UI
  participant BE as Spring Boot API
  participant RP as Razorpay
  participant DB as MySQL

  FE->>BE: POST /api/payment/create
  BE->>RP: Create Razorpay order
  RP-->>BE: order_id
  BE-->>FE: order details

  FE->>RP: User completes payment
  FE->>BE: POST /api/payment/verify

  BE->>RP: Verify payment signature
  RP-->>BE: Signature verified

  BE->>DB: Save order
  BE->>DB: Update inventory
  BE->>DB: Clear cart

  BE-->>FE: Payment successful
```

---

# Contributing

Pull requests are welcome.

Please open an issue first to discuss major changes before submitting a pull request.
