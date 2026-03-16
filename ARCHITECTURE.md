# NexCart Architecture

## Overview
NexCart is a full-stack platform split into three main layers.
- Customer and admin UIs in a React SPA (Vite)
- Spring Boot REST API providing business logic
- MySQL for persistent storage

All authenticated traffic uses HttpOnly JWT cookies. The backend enforces role-based access and exposes separate admin endpoints under `/admin`.

## System Architecture Diagram
```mermaid
flowchart LR
  subgraph FE["Frontend (React + Vite)"]
    CUST["Customer UI"]
    ADMIN["Admin UI"]
  end

  subgraph BE["Backend (Spring Boot)"]
    CTRL["Controllers"]
    SVC["Service Layer"]
    REPO["JPA Repositories"]
    FILTER["AuthenticationFilter"]
  end

  DB[("MySQL")]
  RP["Razorpay"]
  SMTP["SMTP"]

  CUST -->|REST + Cookies| FILTER
  ADMIN -->|REST + Cookies| FILTER
  FILTER --> CTRL
  CTRL --> SVC
  SVC --> REPO
  REPO --> DB
  SVC --> RP
  SVC --> SMTP
```

## Component Diagram
```mermaid
flowchart TB
  subgraph Frontend
    Routes["Routes.jsx"] --> Pages["pages/*"]
    Pages --> Components["components/*"]
    Pages --> Admin["admin/*"]
    Admin --> AdminServices["admin/services/adminApi.js"]
  end

  subgraph Backend
    Controllers["controller/* and admin/controller/*"]
    Services["service/* and admin/service/*"]
    Repositories["repository/*"]
    Entities["entity/*"]
    Controllers --> Services
    Services --> Repositories
    Repositories --> Entities
  end

  AdminServices --> Controllers
```

## Data Flow Diagram
```mermaid
flowchart TD
  A["User Action (UI)"] --> B["API Call (fetch/axios)"]
  B --> C["AuthenticationFilter"]
  C --> D["Controller"]
  D --> E["Service"]
  E --> F["Repository"]
  F --> G["MySQL"]
  G --> F --> E --> D --> B --> A
```

## Frontend Architecture
Entry points
- `NexCartFrontend\src\main.jsx` mounts the React app
- `NexCartFrontend\src\App.jsx` wires routes and layout

Routing
- All routes are defined in `NexCartFrontend\src\routes\Routes.jsx` and include customer, support, and admin areas

UI modules
- Customer UI lives under `NexCartFrontend\src\pages\customer`
- Admin UI lives under `NexCartFrontend\src\admin`
- Shared UI elements live under `NexCartFrontend\src\components`

State and data flow
- REST calls use `fetch` in pages and `adminApi` in admin features
- Cookies are sent via `credentials: "include"` to carry JWT auth
- System settings and coupons are fetched on the checkout page to drive pricing and payment options

## Backend Architecture
Layering
- Controllers map HTTP endpoints to use cases
- Services implement business logic and workflows
- Repositories provide persistence via Spring Data JPA
- Entities map to MySQL tables

Security
- `AuthenticationFilter` intercepts `/api/*` and `/admin/*`
- Admin routes require `Role.ADMIN`
- JWT is stored in `jwt_tokens` table for revocation

Key service responsibilities
- `AuthService` handles login, JWT creation, and reset tokens
- `PaymentService` calculates totals and coordinates Razorpay/COD flows
- `OrderService` assembles order history and return requests
- `SystemSettingsService` caches and groups settings for store, tax, shipping, and payment
- `SupportTicketService` validates and logs customer tickets

## Client-Server Communication
- All API traffic uses JSON over REST
- Authenticated requests use HttpOnly cookies
- CORS is restricted to known origins and `allowCredentials=true`
- On unauthorized responses, the admin UI redirects to `/admin`

## Module Interactions
- Cart -> Checkout -> Payment -> Orders -> Returns
- Support tickets are created from the customer UI and also from return requests
- Admin order updates cascade to return status updates and refunds
- System settings affect pricing, shipping, tax, and payment options in real time

## Architectural Notes
- The separate dashboard template in `dashboard_import/` is not wired into the main app
- Backend is configured with `spring.jpa.hibernate.ddl-auto=update`, so some tables are created via JPA
- Password reset flows use captcha and rate limiting, and audit logs are stored for admin visibility
