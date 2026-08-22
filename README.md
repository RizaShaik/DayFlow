# Dayflow — Human Resource Management System

*Every workday, perfectly aligned.*

Dayflow is a full-stack HRMS: secure auth, role-based dashboards (Admin/HR vs Employee),
employee profiles, attendance (check-in/out with live status), leave/time-off management
with approvals, and payroll/salary structure with automatic component calculation.

## Tech stack

- **Frontend:** React (Vite), React Router, Tailwind CSS, Axios, Socket.IO client
- **Backend:** Node.js, Express, raw SQL via `pg` (no ORM), JWT auth, bcrypt, Zod validation,
  Multer (local file storage), Nodemailer (SMTP), Socket.IO (real-time attendance status)
- **Database:** PostgreSQL

## Prerequisites

- Node.js 20+ and npm
- Docker (for the local Postgres container) — or a local PostgreSQL 16 instance if you'd
  rather not use Docker

## Getting started

Clone the repo, then follow the steps below in order.

### 1. Start the database

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` (db `dayflow`, user/password `dayflow` by default —
see `docker-compose.yml`). If you're using a local Postgres install instead, just make sure a
database matching your `backend/.env` values exists.

### 2. Backend setup

```bash
cd backend
cp .env.example .env    # fill in JWT secrets and SMTP credentials
npm install
npm run migrate         # applies SQL migrations from src/db/migrations
npm run seed             # optional: seeds demo company/admin/employees
npm run dev              # starts the API on http://localhost:5000
```

Verify it's up: `curl http://localhost:5000/api/v1/health` should return
`{"success":true,"data":{"status":"ok", ...}}`.

**Demo accounts** (created by `npm run seed`):

| Role     | Login ID         | Password      | Notes                        |
|----------|-------------------|---------------|-------------------------------|
| Admin/HR | `OIADUS20260001`  | `Admin@123`   | —                              |
| Employee | `OIJODO20260001`  | `Welcome@123` | Must change password on first login |

**Auth / email verification:** Sign Up creates a new company + Admin account and requires email
verification before sign-in. If `SMTP_HOST` is left blank in `backend/.env`, no real email is
sent — the verification link is printed to the backend console instead, so the flow is fully
testable without SMTP credentials. Set `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` to send real email.

Other backend scripts:

```bash
npm test     # runs the backend test suite (node's built-in test runner)
npm run lint # lints backend source with ESLint
```

### 3. Frontend setup

In a second terminal:

```bash
cd frontend
cp .env.example .env    # defaults already point at the local backend
npm install
npm run dev              # starts the app on http://localhost:5173
```

Other frontend scripts:

```bash
npm run build    # production build
npm run preview  # preview the production build locally
npm run lint      # lints frontend source with ESLint
```

### 4. Open the app

Visit `http://localhost:5173`. The header includes a light/dark theme toggle.

## Project structure

```
DayFlow/
├── docker-compose.yml       # local Postgres
├── backend/
│   ├── src/
│   │   ├── config/          # env, database pool
│   │   ├── db/               # schema, migrations, seed script
│   │   ├── modules/          # auth, employees, departments, attendance, timeoff, payroll
│   │   ├── middleware/        # auth, validation, error handling, uploads
│   │   ├── sockets/           # real-time (Socket.IO)
│   │   ├── routes/            # route aggregation + health check
│   │   └── utils/
│   ├── uploads/                # avatars & leave attachments (gitignored)
│   └── tests/
└── frontend/
    └── src/
        ├── api/                # Axios client + per-module API calls
        ├── context/            # Theme, Auth, Socket providers
        ├── hooks/
        ├── components/         # common (design system) + layout
        ├── features/           # auth, employees, attendance, timeoff, dashboard
        └── routes/
```

## Development workflow

This project is built in phases (auth → employee directory/profile → attendance → time off →
payroll → dashboards/polish). Each phase is verified working end-to-end before moving to the
next.
