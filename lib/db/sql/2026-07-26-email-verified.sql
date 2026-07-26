-- Required before deploying account pre-hijack fix.
-- Password registrations set email_verified=false; federated login claims those rows.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT true;
