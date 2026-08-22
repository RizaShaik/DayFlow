# Dayflow

> Every workday, perfectly aligned.

## 1. Project Overview

Dayflow is a full-stack Human Resource Management System (HRMS) for small and mid-sized companies. A company signs up, verifies its email, and gets an admin account; from there the admin builds out the employee directory, and every employee gets their own login for day-to-day HR tasks.

The platform is multi-tenant by design — every tenant-scoped table carries a `company_id`, and API queries, socket rooms, and lookups are all scoped to the requester's company, so a single deployment can serve multiple companies without cross-tenant leakage.

**Primary users**

| Role | Capabilities |
| --- | --- |
| `admin` / `hr` | Create and edit employees, view any profile including bank and salary details, see company-wide attendance, approve or reject time-off requests, configure salary structures |
| `employee` | Check in and out, view their own attendance history, apply for leave against their balance, view and edit their own profile, view their own salary breakdown |

**Major workflows**

1. Company sign-up → email verification → admin sign-in
2. Admin creates an employee → login ID and temporary password are generated → employee signs in and is forced to change the password
3. Employee checks in/out → status propagates live to every connected client in the company
4. Employee applies for leave → admin/HR approves → balance is deducted and attendance is marked for the leave period
5. Admin configures a monthly wage → salary components are computed automatically and become visible on the employee's Salary Info tab

## 2. Why Dayflow?

HR data in small companies tends to be scattered across spreadsheets, chat threads, and email — a leave request lives in one place, the attendance record it should affect lives in another, and nothing reconciles automatically. Dayflow centralizes those workflows so that a single action has all of its downstream effects applied consistently: approving a leave request deducts the balance *and* writes attendance rows *and* pushes the status change to every open browser, in one transaction-backed flow.

**Admin / HR experience.** A dashboard showing headcount, present-today count, and pending approvals with inline approve/reject. Full directory access with live status dots, the ability to create employees (login ID and temporary password generated server-side), edit any profile, view sensitive tabs, run company-wide attendance views, and configure salary structures.

**Employee experience.** A personal dashboard with quick-access cards, today's check-in status, and recent time-off activity. A check-in/check-out widget in the navbar, a monthly attendance view with work-hours breakdown, a leave application flow that validates against the remaining balance, and a tabbed profile where they can edit their own limited fields and avatar.

The distinction is enforced server-side in every case, not just hidden in the UI.

## 3. Key Highlights

- **Two-token auth.** Short-lived JWT access tokens held in memory on the client, paired with refresh tokens in an `httpOnly` cookie — refresh tokens are stored hashed in the database, rotated on every refresh, and revocable at logout.
- **Role-based access control** applied at two layers: an `authorize(...roles)` middleware on route definitions, and per-record ownership checks in the service layer (`isSelf || isPrivileged`) for anything that depends on *whose* record it is.
- **Field-level authorization.** Bank details and salary information are attached to the employee-detail response only when the requester is the employee themselves or an admin/HR — the sensitive tabs are never sent to the browser and then hidden.
- **Real-time attendance** over Socket.IO, with JWT-authenticated handshakes and per-company rooms, so a check-in or an approved leave updates status indicators across every connected client.
- **Raw SQL over `pg`, no ORM.** A hand-written schema with `CHECK` constraint enumerations, composite uniqueness, indexed foreign keys, and `updated_at` triggers.
- **Transactional migrations.** A custom runner applies numbered `.sql` files inside a transaction each, tracked in a `schema_migrations` table, rolling back on failure.
- **Schema-level validation.** Every request body, query string, and route param is parsed by a Zod schema via a shared `validate` middleware that replaces the raw input with the coerced result.
- **Automated leave-to-attendance workflow.** Approval deducts the leave balance (except for unpaid leave) and writes `leave` attendance rows across the requested date range.
- **Derived payroll.** Salary components are computed from a single monthly wage input and always foot back exactly to that wage, with the fixed allowance absorbing the remainder.
- **Modular backend.** Each domain is a self-contained `routes → controller → service → repository` module, keeping SQL out of controllers and HTTP out of services.
- **Constrained file uploads.** Multer with MIME-type allowlists per upload category and a configurable size cap.
- **Email verification and credential delivery** over Nodemailer, with a logged fallback URL when SMTP is not configured so local development works without a mail server.

## 4. Features

### Authentication

- Company sign-up with an optional logo upload, creating the company and its first `admin` user in one transaction.
- Email verification via a single-use opaque token, stored hashed with an expiry. Sign-in is blocked until the email is verified.
- Sign-in by **either** login ID or email address.
- Server-generated login IDs following a deterministic format — two-letter company prefix + two letters of first name + two of last name + joining year + serial (e.g. `OIJODO20260001`). Users never choose their own.
- Admin-created accounts receive a generated temporary password and are flagged `must_change_password`, which forces a password change on first sign-in before the rest of the app is reachable.
- Refresh-token rotation, revocation on logout, and an axios interceptor that transparently retries a single 401 after refreshing.
- Rate limiting: 300 requests per 15 minutes across `/api`, tightened to 20 per 15 minutes on sign-up and sign-in.

### Dashboards

- **Employee:** quick-access cards, today's attendance status, and recent time-off activity.
- **Admin/HR:** headcount, present-today count, and a pending-approvals list with inline approve/reject.

### Employee Directory & Profiles

- Searchable, filterable directory with live status dots (present / on-leave / absent) driven by Socket.IO events.
- Tabbed profile: **Profile**, **Resume** (about, skills, certifications), **Private Info** (date of birth, gender, marital status, nationality, personal email, address), **Bank Details**, **Salary Info**.
- Admin/HR can create employees and edit any profile; employees can edit their own permitted fields only — attempting to edit a restricted field returns an explicit `403` naming the disallowed fields.
- Avatar upload, restricted to JPEG, PNG, or WebP.
- Departments and reporting managers are modeled as foreign keys, with managers self-referencing the employee table.

### Attendance

- Self-service check-in and check-out from a navbar widget, with a today-status endpoint.
- One attendance row per employee per day, enforced by a composite unique constraint, plus a check constraint requiring check-out to be at or after check-in.
- Monthly self-view with days present, days on leave, and work-hours breakdown.
- Company-wide daily view for admin/HR.
- Status changes emit an `attendance:update` event to the company's socket room.

### Time Off

- Three leave types seeded per company: **Paid Time Off**, **Sick Leave**, **Unpaid Leave**.
- Sick Leave requires a supporting attachment (JPEG, PNG, or PDF), enforced by the `requires_attachment` flag on the leave type.
- Per-employee, per-year balances with a database-level check that used days never exceed allocated days.
- Requests carry a start date, end date, computed day count, and optional remarks; admin/HR approve or reject with an optional review comment.
- Approval deducts the balance (unpaid leave excepted) and marks attendance across the leave period; if the leave covers today, a live status update is broadcast.
- Calendar views: a year calendar and month mini-calendar for personal time off, plus a company-wide view for admin/HR.

### Payroll

- Admin/HR configure an employee's monthly wage, working days per week, and break-time hours.
- Nine components are derived from the wage and persisted, replacing any previous configuration:

  | Component | Basis |
  | --- | --- |
  | Basic | 50% of monthly wage |
  | HRA | 50% of Basic |
  | Standard Allowance | 16.6667% of Basic |
  | Performance Bonus | 8.33% of Basic |
  | LTA | 8.333% of Basic |
  | PF (employee) | 12% of Basic |
  | PF (employer) | 12% of Basic |
  | Professional Tax | Flat 200 |
  | Fixed Allowance | Wage − sum of all other earning components |

- Because the fixed allowance absorbs the remainder, the components always reconcile exactly to the configured wage.
- The resulting structure is readable on the employee's Salary Info tab, gated by the same self-or-privileged rule as bank details.

### Theme

Light and dark themes across the application, exposed through a theme context and a navbar toggle, persisted across sessions.

## 5. Architecture

The backend is organized by domain module, and each module is layered: routes declare middleware and validation, controllers handle HTTP, services hold business rules and transactions, and repositories own the SQL. Services never touch `req`/`res`, and controllers never contain queries.

```
                    ┌──────────────────────────────┐
                    │   React 18 + Vite frontend   │
                    │  Router · Context · Tailwind │
                    └──────────────┬───────────────┘
                                   │
                 Axios (Bearer + httpOnly refresh cookie)
                 Socket.IO client (JWT handshake)
                                   │
                    ┌──────────────▼───────────────┐
                    │  Express app (createApp)     │
                    │  helmet · cors · rate limit  │
                    │  cookie-parser · morgan      │
                    ├──────────────────────────────┤
                    │  /api/v1 router              │
                    │  authenticate → authorize    │
                    │  → validate (Zod) → handler  │
                    ├──────────────────────────────┤
                    │  Domain modules              │
                    │  auth · employees · depts    │
                    │  attendance · timeoff        │
                    │  payroll                     │
                    │                              │
                    │  controller → service → repo │
                    ├───────────┬──────────────────┤
                    │ Socket.IO │  Multer disk     │
                    │ server    │  storage         │
                    │ (rooms by │  /uploads        │
                    │  company) │                  │
                    └─────┬─────┴────────┬─────────┘
                          │              │
                    ┌─────▼──────┐  ┌────▼─────────┐
                    │ PostgreSQL │  │ SMTP         │
                    │ 16 (pg     │  │ (Nodemailer) │
                    │ pool, raw  │  └──────────────┘
                    │ SQL)       │
                    └────────────┘
```

Uploaded files are served from a static `/uploads` mount with a `Cross-Origin-Resource-Policy: cross-origin` header, since the Vite dev server runs on a different origin than the API and helmet's default same-origin policy would otherwise block them.

## 6. Tech Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| React 18 | UI |
| Vite | Dev server and build |
| React Router 7 | Routing, protected route wrappers |
| Tailwind CSS 3 | Styling, light/dark theming |
| Axios | HTTP client with auth and refresh interceptors |
| Socket.IO client | Live attendance status |
| Zod | Client-side form validation |

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js 20+ (ESM) | Runtime |
| Express 4 | HTTP framework |
| `pg` | PostgreSQL driver — raw SQL, connection pooling, no ORM |
| jsonwebtoken | Access and refresh token signing |
| bcryptjs | Password hashing |
| Zod | Request validation |
| Socket.IO | Real-time events |
| Multer 2 | Multipart file uploads |
| Nodemailer | Verification emails and credential delivery |
| helmet | Security headers |
| express-rate-limit | Global and auth-specific rate limiting |
| cookie-parser | Refresh-token cookie handling |
| cors | Cross-origin config |
| morgan | Request logging |
| dotenv | Environment loading |

### Database

PostgreSQL 16 with the `pgcrypto` and `citext` extensions. UUID primary keys, `NUMERIC(12,2)` for money, `CHECK` constraints in place of native enums, and `set_updated_at()` triggers on mutable tables.

### Development & Tooling

ESLint 9 (flat config, with React and React Hooks plugins on the frontend), Prettier, nodemon, Docker Compose for local Postgres, and the built-in `node --test` runner.

## 7. Project Structure

```
DayFlow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # pg pool, withTransaction, health check
│   │   │   └── env.js              # typed env access with defaults
│   │   ├── db/
│   │   │   ├── migrations/         # 001_init.sql, 002_auth.sql, run.js
│   │   │   ├── seed/seed.js        # dev-only demo dataset
│   │   │   └── schema.sql          # reference snapshot of applied migrations
│   │   ├── middleware/
│   │   │   ├── authenticate.js     # Bearer token verification
│   │   │   ├── authorize.js        # role gate
│   │   │   ├── upload.js           # Multer storage + MIME allowlists
│   │   │   ├── validate.js         # Zod validation for body/query/params
│   │   │   └── errorHandler.js     # 404 + centralized error responses
│   │   ├── modules/                # one folder per domain
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── departments/
│   │   │   ├── attendance/
│   │   │   ├── timeoff/
│   │   │   └── payroll/
│   │   │       ├── *.routes.js
│   │   │       ├── *.controller.js
│   │   │       ├── *.service.js
│   │   │       ├── *.repository.js
│   │   │       └── *.validation.js
│   │   ├── routes/index.js         # /api/v1 mount + health check
│   │   ├── sockets/index.js        # Socket.IO auth + company rooms
│   │   ├── utils/                  # ApiError, ApiResponse, tokens, mailer,
│   │   │                           # idGenerator, passwordGenerator, dateUtils
│   │   ├── app.js                  # createApp() — middleware pipeline
│   │   └── server.js               # HTTP server + socket bootstrap
│   ├── tests/                      # auth, health, workflows
│   └── uploads/                    # avatars, attachments, logos
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # axios client + per-domain API modules
│   │   ├── components/
│   │   │   ├── common/             # Button, Modal, TextField, Avatar, ...
│   │   │   └── layout/             # AppLayout, Navbar, ProtectedRoute
│   │   ├── context/                # Auth, Theme, Socket providers
│   │   ├── features/               # auth, dashboard, employees, attendance,
│   │   │                           # timeoff — page + component per domain
│   │   ├── hooks/                  # useAuth, useTheme, useSocket
│   │   ├── routes/AppRoutes.jsx
│   │   └── utils/
│   └── vite.config.js
│
└── docker-compose.yml              # local PostgreSQL 16
```

## 8. Prerequisites

- **Node.js 20 or newer** and npm (enforced via `engines` in the backend manifest)
- **Docker** for the local PostgreSQL container — or a local PostgreSQL 16 instance if you'd rather not use Docker
- **SMTP credentials** (optional). Without them, verification links and generated passwords are written to the server log instead of being emailed, which is sufficient for local use.

## 9. Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd DayFlow
```

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 16 on `localhost:5432` with database, user, and password all defaulting to `dayflow`. The values are overridable via `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT`.

### 3. Configure backend environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed — the defaults match the Docker Compose setup. Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to your own values, and fill in the `SMTP_*` block if you want real emails.

### 4. Install backend dependencies

```bash
npm install
```

### 5. Run migrations

```bash
npm run migrate
```

### 6. Seed demo data (optional)

```bash
npm run seed
```

This truncates and repopulates the database, so use it only on a development instance.

### 7. Start the backend

```bash
npm run dev
```

The API listens on `http://localhost:5000`.

### 8. Configure and start the frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

### 9. Open the application

Visit **http://localhost:5173**. Sign up to create a new company, or use the seeded accounts below if you ran the seed script.

## 10. Demo Accounts

These credentials exist only in `backend/src/db/seed/seed.js` and are created solely by the local `npm run seed` script. They are **development fixtures, not deployment credentials** — the seed script should never be run against a shared or public database, and these passwords should be changed before any deployment.

| Role | Login ID | Email | Password | Notes |
| --- | --- | --- | --- | --- |
| Admin | `OIADUS20260001` | `admin@dayflow.local` | `Admin@123` | Full admin access |
| Employee | `OIJODO20260001` | `john.doe@dayflow.local` | `Welcome@123` | Flagged `must_change_password` — prompts for a new password on first sign-in |

Either the login ID or the email can be used as the sign-in identifier. The seeded dataset also includes a company, two departments, three leave types with balances, a configured salary structure, today's attendance, and one pending leave request.

## 11. API Overview

All routes are mounted under `/api/v1`. Authenticated routes expect an `Authorization: Bearer <accessToken>` header; refresh and logout read the `httpOnly` refresh cookie instead. Responses follow a consistent `{ success, data }` / `{ success, error }` envelope.

### Health Check

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Service status, uptime, and database connectivity |

### Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | — | Register a company and its admin user (multipart; optional `logo`) |
| `GET` | `/auth/verify-email/:token` | — | Verify an email address via the emailed token |
| `POST` | `/auth/signin` | — | Sign in with login ID or email; returns an access token and sets the refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Rotate the refresh token and issue a new access token |
| `POST` | `/auth/logout` | Cookie | Revoke the refresh token and clear the cookie |
| `POST` | `/auth/change-password` | Bearer | Change the current user's password |
| `GET` | `/auth/me` | Bearer | Current user and profile summary |

### Employees

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/employees` | Bearer | List the company directory (supports search and filter query params) |
| `POST` | `/employees` | Bearer (admin/HR) | Create an employee; generates a login ID and temporary password |
| `GET` | `/employees/:id` | Bearer | Employee detail; bank and salary blocks included only for self or admin/HR |
| `PATCH` | `/employees/:id` | Bearer | Update a profile; the editable field set depends on the requester |
| `POST` | `/employees/:id/avatar` | Bearer | Upload an avatar image |

### Departments

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/departments` | Bearer | List the company's departments |

Department creation and editing are marked as future work in the source and are not implemented.

### Attendance

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/attendance/check-in` | Bearer | Record a check-in for today |
| `POST` | `/attendance/check-out` | Bearer | Record a check-out for today |
| `GET` | `/attendance/today-status` | Bearer | The requester's status for today |
| `GET` | `/attendance/me` | Bearer | The requester's attendance for a given month |
| `GET` | `/attendance` | Bearer (admin/HR) | Company-wide attendance for a given date |

### Time Off

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/timeoff/balances` | Bearer | The requester's leave balances for the current year |
| `GET` | `/timeoff/requests/me` | Bearer | The requester's leave requests |
| `GET` | `/timeoff/requests` | Bearer (admin/HR) | Company leave requests, filterable by status |
| `POST` | `/timeoff/requests` | Bearer | Apply for leave (multipart; `attachment` required for Sick Leave) |
| `PATCH` | `/timeoff/requests/:id/decision` | Bearer (admin/HR) | Approve or reject a request |

### Payroll

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `PUT` | `/payroll/:employeeId` | Bearer (admin/HR) | Set the monthly wage and recompute all salary components |

Salary structures are **read** through `GET /employees/:id`, which returns the `salaryInfo` block subject to the same access rule.

### Real-Time Events

| Event | Direction | Payload |
| --- | --- | --- |
| `attendance:update` | Server → client | `{ employeeId, status }`, broadcast to the `company:<id>` room |

## 12. Testing

The backend uses Node's built-in test runner — no external test framework.

```bash
cd backend
npm test          # node --test
npm run lint      # eslint src
```

The suite boots the Express app on an ephemeral port and exercises it over HTTP. It currently covers:

| File | Coverage |
| --- | --- |
| `tests/health.test.js` | Health endpoint returns an `ok` status |
| `tests/auth.test.js` | Weak-password rejection, unknown-identifier rejection, unauthenticated access to protected routes, and the full lifecycle: signup → verify → signin → refresh → change-password → logout |
| `tests/workflows.test.js` | End-to-end attendance, time-off, and payroll flow including permission boundaries |

The auth and workflow tests require a running, migrated database, since they exercise real persistence. They capture the server log to recover verification tokens and generated passwords, which is why they work without SMTP configured.

Frontend tooling:

```bash
cd frontend
npm run lint      # eslint src
npm run build     # vite build
npm run preview   # serve the production build
```

There is no automated frontend test suite at present.

## 13. Security

Implemented measures, all verifiable in the source:

- **Password hashing** with bcrypt before storage; plaintext passwords are never persisted.
- **Split-token authentication.** Access tokens are short-lived (15 minutes by default) and held only in JavaScript memory on the client — never in `localStorage` or `sessionStorage`, so they are not readable by injected scripts or persisted across tabs.
- **Refresh tokens in an `httpOnly` cookie** with `sameSite: 'lax'`, `secure` enabled in production, and a scoped path. The token is stored **hashed** in the database, so a leaked dump cannot be replayed for live sessions.
- **Refresh rotation and revocation.** Each refresh revokes the presented token and issues a new one; logout revokes explicitly.
- **Single-use, hashed opaque tokens** with expiry for email verification.
- **Verified-email gate** — sign-in is refused until the address is confirmed.
- **Forced password rotation** for admin-created accounts via the `must_change_password` flag.
- **Role-based route protection** through the `authorize('admin', 'hr')` middleware on privileged endpoints.
- **Ownership checks in the service layer** for record-scoped access, covering the cases a role check alone cannot express.
- **Field-level access control** — bank and salary blocks are omitted from the payload entirely for unauthorized viewers rather than filtered client-side; restricted field edits are rejected with an explicit error.
- **Tenant isolation** — company scoping on queries and on socket rooms, so events and records never cross company boundaries.
- **Authenticated WebSocket handshakes** — the Socket.IO connection verifies the same JWT before joining any room.
- **Schema validation on every input** via Zod, replacing raw request data with parsed, coerced values.
- **File upload restrictions** — MIME-type allowlists per category (images for avatars and logos; images or PDF for attachments), a configurable size limit, and server-generated randomized filenames that discard the client-supplied name.
- **Rate limiting** globally and, more tightly, on authentication endpoints.
- **Security headers** via helmet, with a deliberate, narrowly scoped CORP relaxation for the static uploads path only.
- **Credentialed CORS** restricted to the configured client origin.
- **Parameterized queries** throughout the repository layer.
- **Centralized error handling** that returns structured errors without leaking stack traces.
- **Protected routes** on the client, with a wrapper that redirects unauthenticated users and routes flagged accounts to the password-change screen.

Known limitations worth stating plainly: JWT secrets fall back to development defaults if the environment does not supply them, and uploaded files are served from local disk without per-request authorization — anyone holding a file URL can fetch it.

## 14. Future Improvements

Presented as future work; none of the following is currently implemented.

- **Department management endpoints** — `POST /departments` and `PATCH /departments/:id` are marked as pending in the source.
- **Password reset flow.** The `password_reset_token` and `password_reset_expires_at` columns exist in the schema but no endpoint consumes them yet.
- **Attendance-driven payroll.** The schema notes that unpaid leave and missing days should reduce payable days; component calculation currently derives from the wage alone, independent of attendance.
- **Payslip generation and export** from the existing salary structures.
- **Authorized file serving** — proxy uploads through an authenticated route, or move to object storage with signed URLs, instead of a public static mount.
- **Fail-fast secret validation** — refuse to boot in production when JWT secrets are left at their development defaults.
- **Frontend test suite** and end-to-end coverage of the primary user journeys.
- **Automated leave accrual** and carry-forward rules, rather than fixed annual allocations set at seed time.
- **Notifications** beyond attendance — the socket layer is already in place to carry approval and request events.
- **Containerized application services** — Docker Compose currently provisions only the database.
- **CI pipeline** running lint, build, and the test suite on push.

## 15. Contributors

Dayflow was built collaboratively during a hackathon. Work spanned schema and migration design, the modular backend API and its authentication and authorization layers, the real-time socket infrastructure, the React frontend and its component system, and the payroll and time-off business logic.

The repository does not record per-file authorship, so individual contributions are intentionally not attributed here.

## License

No license file is included in this repository. The project was built for a hackathon and is intended for educational and evaluation purposes.
