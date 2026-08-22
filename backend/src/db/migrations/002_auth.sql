-- Phase 2: auth support.
-- Migrations are append-only — 001_init.sql already ran on existing
-- databases, so fixes/additions land here rather than editing it in place.

-- Email is used as a global sign-in identifier alongside login_id, so it
-- must be unique across the whole system, not just within a company.
ALTER TABLE users DROP CONSTRAINT users_company_id_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Refresh tokens are stored hashed (never the raw token) so a leaked DB
-- doesn't hand out live sessions, and so logout/rotation can revoke them.
CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
