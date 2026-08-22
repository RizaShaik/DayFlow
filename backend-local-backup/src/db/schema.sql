-- Dayflow HRMS — reference schema snapshot.
-- The source of truth is the numbered files in src/db/migrations/ (applied
-- via `npm run migrate`); this file mirrors that state for quick reading.
-- Currently in sync with: migrations/001_init.sql

-- Design notes:
--   * Every tenant-scoped table carries company_id so a single deployment can
--     serve multiple companies without cross-tenant leakage.
--   * Money is stored as NUMERIC(12,2); percentages as NUMERIC(5,2)+.
--   * Enumerations use CHECK constraints (portable, no ALTER TYPE churn).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ── Companies & org structure ────────────────────────────────────────────

CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

-- ── Auth & identity ───────────────────────────────────────────────────────
-- login_id format: OI + first 2 letters of first name + first 2 letters of
-- last name + 4-digit join year + 4-digit serial, e.g. OIJODO20220001.
-- Generated server-side; users never choose their own login_id.

CREATE TABLE users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  login_id                TEXT NOT NULL UNIQUE,
  email                   CITEXT NOT NULL,
  password_hash           TEXT NOT NULL,
  role                    TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
  must_change_password    BOOLEAN NOT NULL DEFAULT false,
  email_verified          BOOLEAN NOT NULL DEFAULT false,
  email_verification_token TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  password_reset_token    TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);

CREATE INDEX idx_users_company ON users(company_id);

-- ── Employees ─────────────────────────────────────────────────────────────

CREATE TABLE employees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code     TEXT NOT NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  avatar_url        TEXT,
  phone             TEXT,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id        UUID REFERENCES employees(id) ON DELETE SET NULL,
  job_position      TEXT,
  work_location     TEXT,
  date_of_joining   DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Resume / about tab
  about             TEXT,
  skills            TEXT[] NOT NULL DEFAULT '{}',
  certifications    TEXT[] NOT NULL DEFAULT '{}',

  -- Private info tab
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('male', 'female', 'other')),
  marital_status    TEXT CHECK (marital_status IN ('single', 'married', 'other')),
  nationality       TEXT,
  personal_email    CITEXT,
  residing_address  TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_code)
);

CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_department ON employees(department_id);

CREATE TABLE bank_details (
  employee_id     UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  account_number  TEXT,
  bank_name       TEXT,
  ifsc_code       TEXT,
  uan_no          TEXT,
  pan_no          TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Attendance ────────────────────────────────────────────────────────────
-- Drives payroll: unpaid leave / missing days reduce payable days (Phase 7).

CREATE TABLE attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date     DATE NOT NULL,
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'absent'
                  CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date),
  CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);

CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, work_date);
CREATE INDEX idx_attendance_date ON attendance(work_date);

-- ── Time off ──────────────────────────────────────────────────────────────

CREATE TABLE leave_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (name IN ('Paid Time Off', 'Sick Leave', 'Unpaid Leave')),
  requires_attachment BOOLEAN NOT NULL DEFAULT false,
  default_allocation_days NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (company_id, name)
);

CREATE TABLE leave_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year            INT NOT NULL,
  allocated_days  NUMERIC(5,2) NOT NULL DEFAULT 0,
  used_days       NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (employee_id, leave_type_id, year),
  CHECK (used_days >= 0 AND used_days <= allocated_days)
);

CREATE TABLE leave_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id     UUID NOT NULL REFERENCES leave_types(id),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  days              NUMERIC(5,2) NOT NULL,
  remarks           TEXT,
  attachment_url    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  review_comment    TEXT,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- ── Payroll / salary ──────────────────────────────────────────────────────
-- Components are auto-computed from monthly_wage per employee (Phase 7):
--   basic = 50% of wage; hra = 50% of basic; standard_allowance ≈ 16.67% of
--   basic; performance_bonus = 8.33% of basic; lta = 8.333% of basic;
--   pf_employee / pf_employer = 12% of basic each; professional_tax = flat
--   200; fixed_allowance = wage − sum(all other components).

CREATE TABLE salary_structures (
  employee_id           UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  monthly_wage          NUMERIC(12,2) NOT NULL DEFAULT 0,
  working_days_per_week SMALLINT NOT NULL DEFAULT 5 CHECK (working_days_per_week BETWEEN 1 AND 7),
  break_time_hours      NUMERIC(4,2) NOT NULL DEFAULT 1,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE salary_components (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  component_type    TEXT NOT NULL CHECK (component_type IN (
                        'basic', 'hra', 'standard_allowance', 'performance_bonus',
                        'lta', 'fixed_allowance', 'pf_employee', 'pf_employer',
                        'professional_tax'
                      )),
  computation_type  TEXT NOT NULL CHECK (computation_type IN ('fixed', 'percentage')),
  value             NUMERIC(10,4) NOT NULL,
  computed_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (employee_id, component_type)
);

-- ── updated_at maintenance ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_salary_structures_updated_at BEFORE UPDATE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
