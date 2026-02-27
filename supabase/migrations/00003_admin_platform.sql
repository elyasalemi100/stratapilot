-- Platform Admin Schema
-- For platform_super_admin only

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');

CREATE TYPE coupon_type AS ENUM ('percent', 'fixed', 'trial_days');

-- Extend users_profile with status and billing
ALTER TABLE users_profile
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS is_enterprise BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enterprise_plan TEXT;

-- Platform settings (key-value for signup blocking, whitelist mode, etc)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('signups_blocked', 'false'),
  ('email_whitelist_enabled', 'false'),
  ('require_email_verification', 'true')
ON CONFLICT (key) DO NOTHING;

-- Email whitelist (when email_whitelist_enabled = true, only these domains/emails can sign up)
CREATE TABLE IF NOT EXISTS email_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern TEXT NOT NULL UNIQUE, -- e.g. @company.com or exact@email.com
  pattern_type TEXT NOT NULL DEFAULT 'domain', -- domain, exact
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id)
);

CREATE INDEX idx_email_whitelist_pattern ON email_whitelist(pattern);

-- Coupon codes for discounts
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  coupon_type coupon_type NOT NULL,
  value NUMERIC(10,2) NOT NULL, -- percent or fixed amount
  max_redemptions INTEGER,
  redemption_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_codes_valid ON coupon_codes(valid_from, valid_until);

-- Extend management_companies for "branches" (Stripe, limits, etc)
ALTER TABLE management_companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS is_enterprise BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_ocs INTEGER,
  ADD COLUMN IF NOT EXISTS max_users INTEGER,
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- RLS for new tables
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_super_admin_write" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'platform_super_admin' AND deleted_at IS NULL)
  );

-- Allow anonymous read of signup-related settings (for signup page)
CREATE POLICY "platform_settings_anon_read" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "email_whitelist_super_admin_all" ON email_whitelist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'platform_super_admin' AND deleted_at IS NULL)
  );

-- Allow anonymous read of whitelist for signup eligibility check
CREATE POLICY "email_whitelist_anon_read" ON email_whitelist
  FOR SELECT USING (true);

CREATE POLICY "coupon_codes_super_admin_only" ON coupon_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'platform_super_admin' AND deleted_at IS NULL)
  );
