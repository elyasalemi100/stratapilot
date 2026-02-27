-- Subscription status for access control
ALTER TABLE management_companies
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
-- Values: active, past_due, canceled, unpaid, null (no subscription)

-- RLS for document_links: allow read by token for share (handled in app via service role)
-- No change - share page will use service role for token lookup
