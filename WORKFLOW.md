# NexCart Workflows

## User Authentication Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Enter login credentials
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate user and password
  DB-->>BE: User record
  BE-->>FE: Set HttpOnly JWT cookie
  FE->>BE: Subsequent protected request
  BE->>BE: Validate JWT and role
  BE-->>FE: Return protected resource
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
  FILTER->>FILTER: Validate JWT and role
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
  FE->>BE: POST /api/payment/create
  BE->>RP: Create Razorpay order
  RP-->>BE: Razorpay order id
  BE-->>FE: Order id and totals

  FE->>RP: User completes payment
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
  BE->>DB: Create order and payment
  BE->>DB: Deduct stock and save order items
  BE->>DB: Clear cart
  BE-->>FE: COD order created
```

## Return and Refund Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as React UI
  participant BE as Spring Boot API
  participant DB as MySQL

  U->>FE: Request return
  FE->>BE: POST /api/orders/{orderId}/return-request
  BE->>DB: Validate delivery status
  BE->>DB: Create return record
  BE->>DB: Create support ticket
  BE-->>FE: Return request submitted

  FE->>BE: Admin updates return status
  BE->>DB: Update return and order status
  BE-->>FE: Return status updated
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
  BE->>DB: Save ticket
  BE-->>FE: Ticket number

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

  U->>FE: Request reset
  FE->>BE: POST /api/auth/forgot-password
  BE->>DB: Validate user and rate limit
  BE->>DB: Create reset token
  BE->>SMTP: Send email
  BE-->>FE: Reset request accepted

  U->>FE: Submit new password
  FE->>BE: POST /api/auth/reset-password
  BE->>DB: Validate token
  BE->>DB: Update password
  BE-->>FE: Reset success
```

## Data Processing Flow
```mermaid
flowchart TD
  A["Cart Items"] --> B["Totals Calculation"]
  B --> C["Shipping Rules"]
  B --> D["Tax Rules"]
  B --> E["Coupon Discount"]
  C --> F["Final Total"]
  D --> F
  E --> F
  F --> G["Order Creation"]
  G --> H["Payment Verification"]
  H --> I["Stock Update"]
```
