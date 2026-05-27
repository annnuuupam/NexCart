# NexCart Documentation Index

Last updated: May 2026

This index is the starting point for all project documentation. Each page links to deeper technical detail without requiring readers to inspect the codebase directly.

## Core Guides

| Document | Purpose |
|---|---|
| `README.md` | Project overview, setup, and quickstart |
| `ARCHITECTURE.md` | System architecture, dual-cookie auth, dynamic branding diagrams |
| `FEATURES.md` | Feature inventory for customer and admin |
| `API_DOCUMENTATION.md` | Full API reference with examples |
| `DATABASE_SCHEMA.md` | Database schema, table definitions, and ER diagrams |
| `WORKFLOW.md` | User and system workflows with sequence diagrams |
| `SECURITY.md` | Authentication, authorization, dual-cookie design |
| `DEPLOYMENT.md` | Local and production deployment steps |
| `CONTRIBUTING.md` | Contribution workflow and standards |
| `FOLDER_STRUCTURE.md` | Full directory tree with annotations |

## Extended Documentation

| Document | Purpose |
|---|---|
| `NexCart_Documentation.md` | Expanded system documentation |
| `PROJECT_REPORT.md` | Project report, module breakdown, and interview guide |

## Key Architectural Topics by Document

| Topic | Primary Document |
|---|---|
| Dual-cookie JWT auth (`authToken` / `adminAuthToken`) | `SECURITY.md`, `ARCHITECTURE.md`, `WORKFLOW.md` |
| Dynamic store branding (`useStoreName.js`) | `ARCHITECTURE.md`, `FEATURES.md`, `WORKFLOW.md` |
| Checkout + Razorpay + COD flow | `WORKFLOW.md`, `API_DOCUMENTATION.md` |
| Database schema and relationships | `DATABASE_SCHEMA.md` |
| Admin panel capabilities | `FEATURES.md`, `API_DOCUMENTATION.md` |
| Password reset workflow | `WORKFLOW.md`, `SECURITY.md` |
| Return and refund flow | `WORKFLOW.md`, `API_DOCUMENTATION.md` |
| Deployment (Docker / Vercel) | `DEPLOYMENT.md` |

## Module-Specific Docs
- `NexCartFrontend\README.md` — Frontend setup and structure
- `nexcartBackEnd\README.md` — Backend setup and structure
- `dashboard_import\react-admin-dashboard-master\README.md` — Standalone dashboard template (not integrated)
