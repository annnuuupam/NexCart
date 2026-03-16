# NexCart Features

## Customer Features
- Secure registration, login, logout, and profile updates
- JWT session via HttpOnly cookies with automatic enforcement
- Product discovery with category filters and search query
- Product detail pages with images and customer reviews
- Cart management with live stock validation
- Coupon discovery from `/api/store/coupons`
- Coupon validation with minimum order and maximum discount rules
- Checkout with shipping address, tax, and shipping calculations
- Razorpay payment flow with signature verification
- Cash on Delivery checkout flow
- Order history with full price breakdown and tracking number
- Return and refund requests with reason capture
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
- Store configuration and settings management
- Editable password reset email template

## Security Features
- BCrypt password hashing
- JWT tokens signed with HS512 and stored for revocation
- Role-based access control on `/admin` routes
- Captcha and rate limiting on password reset
- Account blocking and status enforcement
- CORS and credentialed cookies

## Payments and Integrations
- Razorpay checkout for online payments
- COD as a fallback method
- Email integration via SMTP for reset links

## Backend Services
- Auth and password reset workflow services
- Cart and stock validation services
- Payment and order orchestration services
- Support ticketing services
- System settings cache and grouping

## Admin Dashboard UI Capabilities
- Multi-page layout for products, orders, customers, coupons, analytics, support, and settings
- Data tables with consistent formatting
- Status and KPI visualization via charts

## Separate Template Module
- `dashboard_import/react-admin-dashboard-master` is a standalone dashboard template project with Material UI and Nivo charts
- It is provided for reference and is not integrated into the main NexCart UI
