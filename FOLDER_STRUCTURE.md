# NexCart Folder Structure

## Root
| File | Purpose |
|---|---|
| `README.md` | Main project overview |
| `DOCUMENTATION_INDEX.md` | Documentation landing page |
| `ARCHITECTURE.md` | System architecture details and Mermaid diagrams |
| `API_DOCUMENTATION.md` | REST API reference |
| `DATABASE_SCHEMA.md` | Database schema, table definitions, and ER diagram |
| `FEATURES.md` | Feature inventory |
| `WORKFLOW.md` | End-to-end workflow sequence diagrams |
| `SECURITY.md` | Security design and dual-cookie auth |
| `DEPLOYMENT.md` | Deployment guide |
| `CONTRIBUTING.md` | Contribution guide |
| `NexCart_Documentation.md` | Expanded project documentation |
| `PROJECT_REPORT.md` | Project report and interview preparation |
| `FOLDER_STRUCTURE.md` | This file |

## Frontend: `NexCartFrontend/`
```
NexCartFrontend/
├── package.json                 # Dependencies and scripts
├── .env / .env.local            # API base URL configuration (VITE_API_URL)
├── index.html                   # Vite HTML entry point
├── src/
│   ├── main.jsx                 # React app mount
│   ├── App.jsx                  # Root layout and theming
│   ├── routes/
│   │   └── Routes.jsx           # All customer and admin route definitions
│   ├── hooks/
│   │   └── useStoreName.js      # Custom hook: fetches store name from /api/settings
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   └── customer/
│   │       ├── CustomerHomePage.jsx
│   │       ├── ProductDetailsPage.jsx
│   │       ├── CartPage.jsx         # Checkout + Razorpay + COD + dynamic branding
│   │       ├── OrderPage.jsx        # Order history + branded invoice generation
│   │       ├── ProfilePage.jsx
│   │       ├── AboutPage.jsx        # Dynamic store name branding
│   │       ├── WishlistPage.jsx
│   │       └── support/             # Help, returns policy, contact, tickets
│   ├── admin/
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── Sidebar.jsx          # Dynamic store name in sidebar header
│   │   │   └── Navbar.jsx           # Dynamic admin profile via /api/auth/me
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AnalyticsPage.jsx    # Dynamic store name in chart headers
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── CategoriesPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   ├── CustomersPage.jsx
│   │   │   ├── CouponsPage.jsx
│   │   │   ├── SupportPage.jsx
│   │   │   ├── SettingsPage.jsx     # Admin store name and system settings editor
│   │   │   └── NotificationsPage.jsx
│   │   ├── services/
│   │   │   └── adminApi.js          # Centralized admin API client (credentials: include)
│   │   ├── components/
│   │   │   └── ...                  # Admin-specific UI components
│   │   └── data/                    # Static seed/config data
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx           # Dynamic store name branding
│   │   │   ├── Logo.jsx             # Dynamic store name branding
│   │   │   └── ThemeToggle.jsx
│   │   ├── cart/                    # Cart modal and cart item components
│   │   └── ui/                     # Toasts, skeletons, notices
│   ├── styles/                      # Application CSS
│   └── config/
│       └── api.js                   # VITE_API_URL export (API_BASE_URL)
├── public/                          # Static assets
└── dist/                            # Production build output
```

## Backend: `nexcartBackEnd/`
```
nexcartBackEnd/
├── pom.xml                          # Maven configuration and dependencies
├── Dockerfile                       # Backend container build
└── src/
    ├── main/
    │   ├── java/com/nexcart/backend/
    │   │   ├── NexCartApplication.java
    │   │   ├── controller/          # 13 customer-facing REST controllers
    │   │   │   ├── AuthController.java
    │   │   │   ├── UserController.java
    │   │   │   ├── ProductController.java
    │   │   │   ├── CategoryController.java
    │   │   │   ├── CartController.java
    │   │   │   ├── PaymentController.java
    │   │   │   ├── OrderController.java
    │   │   │   ├── CouponController.java
    │   │   │   ├── ReviewController.java
    │   │   │   ├── SupportController.java
    │   │   │   ├── StoreController.java
    │   │   │   ├── SystemSettingsController.java
    │   │   │   └── UserNotificationController.java
    │   │   ├── admin/
    │   │   │   ├── controller/      # 11 admin REST controllers
    │   │   │   │   ├── AdminDashboardController.java
    │   │   │   │   ├── AdminBusinessController.java
    │   │   │   │   ├── AdminProductController.java
    │   │   │   │   ├── AdminCategoryController.java
    │   │   │   │   ├── AdminOrderController.java
    │   │   │   │   ├── AdminCouponController.java
    │   │   │   │   ├── AdminUserController.java
    │   │   │   │   ├── AdminUsersController.java
    │   │   │   │   ├── AdminSupportController.java
    │   │   │   │   ├── AdminSettingsController.java
    │   │   │   │   └── AdminNotificationController.java
    │   │   │   └── service/         # Admin-specific service implementations
    │   │   ├── service/             # Business logic services
    │   │   ├── repository/          # Spring Data JPA repositories
    │   │   ├── entity/              # JPA entities (User, Product, Order, etc.)
    │   │   ├── dto/                 # Request/Response DTOs
    │   │   ├── filter/
    │   │   │   └── AuthenticationFilter.java  # JWT + dual-cookie enforcement
    │   │   └── config/              # CorsConfig, admin bootstrap
    │   └── resources/
    │       ├── application.properties
    │       ├── db/
    │       │   ├── nexcart_schema.sql
    │       │   ├── nexcart_seed.sql
    │       │   └── nexcart_settings_migration.sql
    │       └── templates/           # Email templates
    └── test/                        # Integration tests
```

## Dashboard Template: `dashboard_import/`
- `react-admin-dashboard-master/` — Standalone admin dashboard template project (not integrated into main app)

## Build and Tooling
| Path | Purpose |
|---|---|
| `nexcartBackEnd/target/` | Maven build output |
| `NexCartFrontend/dist/` | Vite production build output |
| `.vscode/` | Editor settings |
| `.gitignore` | Git exclusions |
| `vercel.json` | Vercel deployment configuration |
