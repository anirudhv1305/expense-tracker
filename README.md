# Expense Tracker

## Project Overview

Expense Tracker is a production-ready, multi-user personal finance application for tracking income, expenses, monthly balances, category analytics, and exports. It includes secure registration/login, JWT-protected APIs, per-user data isolation, automatic monthly rollover, category and subcategory analytics, and responsive light/dark UI.

## Features

- Register and login with JWT authentication and BCrypt password hashing
- Per-user isolation for settings, monthly records, transactions, notes, and reports
- First-time balance setup for every user
- Automatic monthly cycle with previous closing balance as the next opening balance
- Dashboard with current balance, opening balance, credits, debits, savings, transaction count, pie chart, and recent transactions
- Credit/debit transaction creation, editing, and deletion with automatic recalculation
- Outings subcategories and dynamic category detail popups
- Monthly history with archived monthly dashboards
- Daily spending trends, credit-vs-debit chart, category breakdowns, income summary, insights, notes, and comparisons
- CSV and Excel exports
- Responsive React UI with dark mode
- Flyway-managed PostgreSQL schema
- Spring Boot health endpoint for deployment monitoring

## Screenshots

Screenshots can be added after production deployment.

- Dashboard: `docs/screenshots/dashboard.png`
- Transaction form: `docs/screenshots/transaction-form.png`
- Monthly history: `docs/screenshots/monthly-history.png`
- Category analytics popup: `docs/screenshots/category-popup.png`

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Recharts
- Axios
- React Router
- Lucide Icons

### Backend

- Java 21
- Spring Boot 3
- Spring Web
- Spring Security
- JWT
- Spring Data JPA
- Bean Validation
- Flyway
- PostgreSQL
- Lombok
- Maven
- Apache POI
- OpenCSV
- Spring Boot Actuator

## Architecture

```text
frontend/
  src/components   Reusable UI, charts, modals, transaction table
  src/pages        Login, register, setup, dashboard, monthly dashboard
  src/services     Axios API client
  src/state        App/session context

backend/
  controller       REST API endpoints
  service          Business logic, auth-aware ownership checks, recalculation
  repository       Spring Data JPA repositories
  entity packages  Users, settings, months, transactions, categories, notes
  dto              Request/response DTOs
  security         JWT filter, security config, current-user service
  resources/db     Flyway migrations
```

All protected API requests require a JWT. User-owned resources are always queried by both resource ID and authenticated user ID, preventing cross-user access by changing IDs.

## Database

PostgreSQL is managed with Flyway migrations in `backend/src/main/resources/db/migration`.

Core tables:

- `users`
- `settings`
- `monthly_records`
- `transactions`
- `categories`
- `credit_sources`
- `monthly_notes`

Flyway must remain enabled in production. Do not manually modify the schema.

## Installation

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16+ or Neon PostgreSQL

### Backend

Set environment variables:

```bash
DATABASE_URL=jdbc:postgresql://host:5432/database?sslmode=require
DATABASE_USERNAME=your_database_user
DATABASE_PASSWORD=your_database_password
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
SPRING_PROFILES_ACTIVE=prod
PORT=8080
```

Run:

```bash
cd backend
mvn spring-boot:run
```

Health endpoint:

```text
/actuator/health
```

### Frontend

Set the API URL in Vercel or a local `.env` file:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Run:

```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Backend on Northflank

Use a Java 21 Maven service connected to this GitHub repository.

Recommended settings:

- Build command: `cd backend && mvn -DskipTests package`
- Start command: `cd backend && java -jar target/expense-tracker-0.0.1-SNAPSHOT.jar`
- Health path: `/actuator/health`
- Production profile: `SPRING_PROFILES_ACTIVE=prod`

Required environment variables:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
CORS_ALLOWED_ORIGINS
SPRING_PROFILES_ACTIVE=prod
PORT
JWT_EXPIRATION_MINUTES=120
```

For Neon, use a JDBC URL with SSL enabled:

```text
jdbc:postgresql://HOST/DATABASE?sslmode=require
```

### Frontend on Vercel

Use the `frontend` directory as the project root.

Recommended settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-backend-domain.com/api`

`frontend/vercel.json` includes SPA routing support.

## Future Improvements

- Refresh-token based auth flow
- Password reset email workflow
- Editable category/source management
- Budget limits and recurring transactions
- User profile settings
- Dashboard code splitting for smaller frontend bundles
- Automated integration test suite
- CI/CD pipeline with build and migration validation

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/settings/status`
- `POST /api/settings/setup`
- `GET /api/dashboard`
- `GET /api/dashboard/history`
- `GET /api/lookups/categories`
- `GET /api/lookups/credit-sources`
- `POST /api/transactions`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
- `GET /api/months/{monthId}`
- `PUT /api/months/{monthId}/notes`
- `GET /api/exports/{monthId}/csv`
- `GET /api/exports/{monthId}/excel`
