# NexCart Features

## Customer Features
- Secure registration, login, logout, and profile updates
- JWT session via HttpOnly `authToken` cookie — automatic enforcement on all `/api/*` routes
- Product discovery with category filters and search query
- Product detail pages with images and customer reviews
- Cart management with live stock validation
- Coupon discovery from `/api/store/coupons`
- Coupon validation with minimum order and maximum discount rules
- Checkout with shipping address, tax, and shipping calculations driven by system settings
- Razorpay payment flow with signature verification
- Cash on Delivery checkout flow
- Order history with full price breakdown and tracking number
- Return and refund requests with reason capture (delivery required)
- Support center content for help, returns, and contact
- Support ticket creation and ticket history
- Password reset with captcha and rate limiting

## Admin Features
- Dashboard KPI overview for recent business data
- Daily, monthly, yearly, and overall business reports
- Product management with images, stock, and status control
- Category management with image URLs
- Order list with status and tracking updates
- Return request handling including refunds and admin notes
- Customer search with status filters and pagination
- User block/unblock and profile updates
- Admin-triggered password reset email
- Coupon lifecycle management and status toggling
- Support ticket queue with search and status updates
- Support reset audit logs with CSV export
- **Store name management** — Admin can rename the store from the Settings page. The new name propagates across the entire frontend (Logo, Footer, About, Invoices, Admin panels) via `useStoreName.js`
- Store configuration: shipping rules, tax (GST), and payment method toggles (Razorpay / COD)
- Editable password reset email template
- Notification management

## Security Features
- BCrypt password hashing
- JWT tokens signed with HS512 and stored in `jwt_tokens` for revocation
- **Dual-cookie isolation**: `authToken` (Customer) and `adminAuthToken` (Admin) enable concurrent sessions
- Role-based access control — `/admin/*` requires `Role.ADMIN`
- Captcha and rate limiting on password reset
- Account blocking and status enforcement
- CORS and credentialed cookies

## Payments and Integrations
- Razorpay checkout for online payments with server-side signature verification
- COD as a fallback method
- Email integration via SMTP for reset links and templates

## Dynamic Branding
- Store name is stored in `system_settings` and editable from the Admin Settings page
- `useStoreName.js` React hook fetches and caches the store name from `/api/settings`
- All branding-sensitive components (Logo, Footer, About Page, Order invoices, Admin Sidebar, Admin Navbar, Analytics page) consume the hook — the entire UI renames itself without a redeploy

## Backend Services
| Service | Responsibility |
|---|---|
| `AuthService` | Login, JWT creation, dual-cookie assignment, logout, reset tokens |
| `CartService` | Cart CRUD with stock validation |
| `PaymentService` | Totals calculation, Razorpay order creation, COD flow |
| `OrderService` | Order history, return request validation |
| `SupportTicketService` | Ticket creation, validation, and status updates |
| `SystemSettingsService` | Settings cache, grouping for store/shipping/tax/payment |
| `CaptchaService` | Math captcha generation and verification |
| `PasswordResetRateLimiter` | IP/identifier-based rate limiting for reset requests |
| `PasswordResetAuditService` | Audit logging for all reset attempts |

## Admin Dashboard UI Pages
| Page | Capabilities |
|---|---|
| Dashboard | KPI cards, recent orders and business metrics |
| Analytics | Daily/monthly/yearly revenue and order charts |
| Products | CRUD with images, stock, status control |
| Categories | Category CRUD with image URL |
| Orders | Status updates, tracking number management |
| Customers | Search, filter, block/unblock, profile edits |
| Coupons | Lifecycle management, enable/disable |
| Support | Ticket queue, filters, admin notes, status updates |
| Settings | Store name, shipping rules, tax config, payment methods |
| Notifications | Notification management |

## Separate Template Module
- `dashboard_import/react-admin-dashboard-master` is a standalone dashboard template project with Material UI and Nivo charts
- It is provided for reference and is not integrated into the main NexCart UI
