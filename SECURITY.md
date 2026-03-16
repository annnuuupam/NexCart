# NexCart Security

## Authentication
- JWT tokens are issued on successful login and stored in an HttpOnly cookie named `authToken`
- Tokens are signed with HS512 and validated on every request
- Tokens are persisted in `jwt_tokens` so sessions can be revoked on logout

## Authorization
- `AuthenticationFilter` protects `/api/*` and `/admin/*`
- Admin-only routes require `Role.ADMIN`
- Users can be blocked and are denied access when blocked

## Password Handling
- Passwords are hashed with BCrypt
- Password reset flow requires captcha verification and rate limiting
- Reset tokens are short-lived and stored in `password_reset_tokens`

## Token and Cookie Handling
- JWT cookie is HttpOnly and `SameSite=Lax` for local, `SameSite=None` for secure origins
- Token expiry defaults to 1 hour

## Data Validation
- Request payloads are validated in services and controllers for required fields
- Stock checks occur both on cart updates and during checkout

## Security Controls in the Codebase
- Captcha generation and verification in `CaptchaService`
- Rate limiting in `PasswordResetRateLimiter`
- Audit logging in `PasswordResetAuditService`
- Admin-only filters in `AuthenticationFilter`

## CORS and Origin Restrictions
- CORS is restricted to trusted domains in `CorsConfig` and `AuthenticationFilter`
- Requests must include credentials for authenticated access

## Recommendations for Production
- Move credentials and secrets from `application.properties` to environment variables
- Rotate `JWT_SECRET` and Razorpay keys regularly
- Enable HTTPS and secure cookies
- Add rate limiting to login and payment endpoints
- Consider Spring Security configuration for additional protections
- Add monitoring for suspicious login and reset activity
