# NexCart Workflows

## User Authentication Flow — Dual-Cookie

### Customer Login
```mermaid
sequenceDiagram
  participant U as Customer
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Enter login credentials
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate user and BCrypt hash
  DB-->>BE: User record (Role = CUSTOMER)
  BE-->>FE: Set HttpOnly authToken cookie
  FE->>BE: Subsequent /api/* request with authToken
  BE->>BE: Validate JWT and role
  BE-->>FE: Return protected resource
```

### Admin Login
```mermaid
sequenceDiagram
  participant A as Admin
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  A->>FE: Enter admin credentials
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate user and BCrypt hash
  DB-->>BE: User record (Role = ADMIN)
  BE-->>FE: Set HttpOnly adminAuthToken cookie
  FE->>BE: Subsequent /admin/* request with adminAuthToken
  BE->>BE: Validate JWT and require Role.ADMIN
  BE-->>FE: Return admin resource
```

### Concurrent Session (Both Logged In)
```mermaid
flowchart LR
  Browser["Browser\n(localhost:5174)"] -->|authToken| CustomerAPI["/api/* routes\n(CUSTOMER)"]
  Browser -->|adminAuthToken| AdminAPI["/admin/* routes\n(ADMIN)"]
  CustomerAPI --> BE["Spring Boot API"]
  AdminAPI --> BE
```

## API Request Lifecycle
```mermaid
sequenceDiagram
  participant FE as React UI
  participant FILTER as AuthenticationFilter
  participant CTRL as Controller
  participant SVC as Service
  participant REPO as Repository
  participant DB as MySQL

  FE->>FILTER: Request with cookies
  FILTER->>FILTER: Determine cookie (authToken vs adminAuthToken)
  FILTER->>FILTER: Validate JWT and check role
  FILTER->>CTRL: Forward request
  CTRL->>SVC: Invoke business logic
  SVC->>REPO: Read or write data
  REPO->>DB: SQL operations
  DB-->>REPO: Data
  REPO-->>SVC: Domain objects
  SVC-->>CTRL: Response payload
  CTRL-->>FE: JSON response
```

## Checkout and Payment Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant RP as Razorpay
  participant DB as MySQL

  U->>FE: Add items to cart
  FE->>BE: POST /api/cart/add
  BE->>DB: Validate stock and update cart

  U->>FE: Checkout
  FE->>BE: GET /api/settings (shipping, tax, payment methods)
  FE->>BE: POST /api/coupons/validate (if coupon applied)
  FE->>BE: POST /api/payment/create
  BE->>RP: Create Razorpay order
  RP-->>BE: Razorpay order id
  BE-->>FE: Order id and totals

  FE->>RP: User completes payment (Razorpay checkout UI)
  FE->>BE: POST /api/payment/verify
  BE->>RP: Verify payment signature
  RP-->>BE: Verification result
  BE->>DB: Save order, update stock, clear cart
  BE-->>FE: Payment verified
```

## COD Order Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Choose COD
  FE->>BE: POST /api/payment/cod
  BE->>DB: Validate stock
  BE->>DB: Create order and payment record
  BE->>DB: Deduct stock and save order items
  BE->>DB: Clear cart
  BE-->>FE: COD order created with orderId
```

## Return and Refund Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Request return on delivered order
  FE->>BE: POST /api/orders/{orderId}/return-request
  BE->>DB: Validate delivery status (must be DELIVERED)
  BE->>DB: Create return record (status=REQUESTED)
  BE->>DB: Auto-create support ticket for return
  BE-->>FE: Return request submitted

  FE->>BE: Admin views return in Admin Panel
  FE->>BE: Admin updates return status
  BE->>DB: Update return and order status
  BE-->>FE: Return status updated (APPROVED / REJECTED / REFUNDED)
```

## Support Ticket Workflow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Submit support ticket
  FE->>BE: POST /api/support/tickets
  BE->>DB: Save ticket with OPEN status
  BE-->>FE: Ticket number (SUP-XXXXX)

  FE->>BE: Admin views ticket queue
  BE->>DB: Query all tickets with filters
  DB-->>BE: Tickets list
  FE->>BE: Admin updates ticket
  BE->>DB: Update status and admin note
  BE-->>FE: Updated ticket
```

## Password Reset Workflow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL
  participant SMTP as SMTP Provider

  U->>FE: Request reset (enter email/username + captcha)
  FE->>BE: POST /api/auth/forgot-password
  BE->>BE: Verify captcha answer (CaptchaService)
  BE->>BE: Check rate limit (PasswordResetRateLimiter)
  BE->>DB: Validate user exists
  BE->>DB: Create short-lived reset token
  BE->>DB: Log audit record (PasswordResetAuditService)
  BE->>SMTP: Send reset email with token link
  BE-->>FE: Reset request accepted

  U->>FE: Open email link and submit new password
  FE->>BE: POST /api/auth/reset-password
  BE->>DB: Validate token (exists + not expired)
  BE->>DB: Update password (BCrypt hash)
  BE->>DB: Invalidate reset token
  BE-->>FE: Reset success
```

## Dynamic Branding Flow
```mermaid
sequenceDiagram
  participant FE as React Component
  participant HOOK as useStoreName.js
  participant SESSION as sessionStorage
  participant BE as Spring Boot API
  participant DB as MySQL

  FE->>HOOK: Call useStoreName()
  HOOK->>SESSION: Check 'storeName' cache
  alt Cache hit
    SESSION-->>HOOK: Return cached name
  else Cache miss
    HOOK->>BE: GET /api/settings
    BE->>DB: Query system_settings (store.storeName)
    DB-->>BE: Setting value
    BE-->>HOOK: { store: { storeName: "..." } }
    HOOK->>SESSION: Store in sessionStorage
    HOOK-->>FE: Return storeName
  end

  Admin->>BE: PUT /admin/settings (update storeName)
  BE->>DB: Update system_settings record
```

## Admin Store Name Update Flow
```mermaid
sequenceDiagram
  participant A as Admin
  participant FE as Admin SettingsPage
  participant BE as Spring Boot API
  participant DB as MySQL

  A->>FE: Change store name in Settings form
  FE->>BE: POST /admin/settings/store (new storeName)
  BE->>DB: Upsert system_settings key 'store_name'
  DB-->>BE: Updated record
  BE-->>FE: Settings saved
  Note over FE: Next page load or component mount<br/>clears sessionStorage and re-fetches
```

## Data Processing Flow
```mermaid
flowchart TD
  A["Cart Items"] --> B["Totals Calculation"]
  B --> C["Shipping Rules\n(from system_settings)"]
  B --> D["Tax Rules\n(from system_settings)"]
  B --> E["Coupon Discount\n(validated server-side)"]
  C --> F["Final Total"]
  D --> F
  E --> F
  F --> G["Order Creation\n(Razorpay or COD)"]
  G --> H["Payment Verification\n(Razorpay signature)"]
  H --> I["Stock Update + Cart Clear"]
```
