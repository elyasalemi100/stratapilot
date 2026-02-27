-- OTP verifications for signup (6-digit code via Resend)
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_email_purpose ON otp_verifications(email, purpose);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- RLS: no policies - only service role (server-side) can access
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
