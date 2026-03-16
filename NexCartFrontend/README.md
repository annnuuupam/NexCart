# NexCart Frontend

This folder contains the React (Vite) SPA for NexCart. It includes both customer and admin UI flows.

## Key Features
- Customer storefront and checkout
- Admin dashboard pages
- Support center and help pages
- Razorpay checkout integration
- Toast notifications and skeleton loaders

## Tech Stack
- React 19, React Router 7, Vite 7
- Tailwind CSS 4 and custom CSS
- Recharts, Framer Motion, Lottie

## Running Locally
1. Create `.env.local` with the backend URL:
```
VITE_API_URL=http://localhost:9090
```
2. Install and run:
```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5174`.

## Project Structure
- `src/routes/Routes.jsx` Routing
- `src/pages/` Customer, auth, and support pages
- `src/admin/` Admin pages, layout, and services
- `src/components/` Shared UI components
- `src/styles/` CSS styles

## Notes
- Authentication is cookie-based, so `credentials: "include"` is required on API calls
- Admin calls are centralized in `src/admin/services/adminApi.js`
