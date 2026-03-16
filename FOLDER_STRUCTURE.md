# NexCart Folder Structure

## Root
- `C:\Users\anupa\OneDrive\Desktop\NexCart\README.md` Main project overview
- `C:\Users\anupa\OneDrive\Desktop\NexCart\ARCHITECTURE.md` System architecture details
- `C:\Users\anupa\OneDrive\Desktop\NexCart\API_DOCUMENTATION.md` REST API reference
- `C:\Users\anupa\OneDrive\Desktop\NexCart\DATABASE_SCHEMA.md` Database schema and ER diagrams
- `C:\Users\anupa\OneDrive\Desktop\NexCart\FEATURES.md` Feature inventory
- `C:\Users\anupa\OneDrive\Desktop\NexCart\WORKFLOW.md` End-to-end workflows
- `C:\Users\anupa\OneDrive\Desktop\NexCart\DEPLOYMENT.md` Deployment guide
- `C:\Users\anupa\OneDrive\Desktop\NexCart\SECURITY.md` Security design
- `C:\Users\anupa\OneDrive\Desktop\NexCart\CONTRIBUTING.md` Contribution guide
- `C:\Users\anupa\OneDrive\Desktop\NexCart\NexCart_Documentation.md` Expanded project documentation
- `C:\Users\anupa\OneDrive\Desktop\NexCart\PROJECT_REPORT.md` Project report and interview material

## Frontend: `NexCartFrontend/`
- `package.json` Frontend dependencies and scripts
- `.env`, `.env.example`, `.env.local` API base URL configuration
- `index.html` Vite HTML entry
- `src/` React source
- `src/routes/Routes.jsx` App routing for customer and admin pages
- `src/pages/` Customer and auth screens
- `src/admin/` Admin layout, pages, and services
- `src/components/` Shared UI components
- `src/styles/` Application styles
- `public/` Static assets used by the UI
- `dist/` Production build output

## Backend: `nexcartBackEnd/`
- `pom.xml` Maven configuration and dependencies
- `Dockerfile` Backend container build
- `src/main/java/com/nexcart/backend/` Application code
- `controller/` Customer APIs
- `admin/controller/` Admin APIs
- `service/` Business logic and workflows
- `repository/` Spring Data JPA repositories
- `entity/` JPA entity models and enums
- `filter/` AuthenticationFilter
- `config/` Application configuration and admin bootstrap
- `src/main/resources/` Properties, SQL scripts, email templates
- `src/test/` Tests

## Dashboard Template: `dashboard_import/`
- `react-admin-dashboard-master/` Standalone admin dashboard template project

## Build and Tooling
- `target/` Maven build output
- `dist/` Vite build output
- `.vscode/` Editor settings
