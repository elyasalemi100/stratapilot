-- StrataPilot Initial Schema
-- Postgres 15+, Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'platform_super_admin',
  'management_admin',
  'strata_manager',
  'committee_member',
  'lot_owner',
  'read_only_auditor'
);

CREATE TYPE occupancy_type AS ENUM ('owner', 'tenant');

CREATE TYPE committee_position AS ENUM ('chair', 'secretary', 'treasurer', 'member');

CREATE TYPE fund_type AS ENUM ('admin', 'capital_works');

CREATE TYPE transaction_type AS ENUM ('debit', 'credit');

CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled');

CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'reversed');

CREATE TYPE meeting_type AS ENUM ('agm', 'egm', 'committee');

CREATE TYPE document_folder AS ENUM ('financial', 'meetings', 'compliance', 'contracts', 'general');

CREATE TYPE email_status AS ENUM ('pending', 'sent', 'delivered', 'bounced', 'failed');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

CREATE TABLE management_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  abn TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  management_company_id UUID REFERENCES management_companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'strata_manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE oc (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  management_company_id UUID NOT NULL REFERENCES management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan_number TEXT NOT NULL,
  address TEXT,
  abn TEXT,
  gst_registered BOOLEAN DEFAULT FALSE,
  management_start_date DATE,
  management_end_date DATE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_oc_management_company ON oc(management_company_id);
CREATE INDEX idx_oc_slug ON oc(slug);
CREATE INDEX idx_oc_deleted ON oc(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE user_oc_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, oc_id)
);

CREATE INDEX idx_user_oc_user ON user_oc_assignments(user_id);
CREATE INDEX idx_user_oc_oc ON user_oc_assignments(oc_id);

CREATE TABLE oc_subdivisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  plan_number TEXT NOT NULL,
  common_property_notes TEXT,
  lot_schedule JSONB, -- [{lot_number, address, entitlements, liabilities}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_oc_subdivisions_oc ON oc_subdivisions(oc_id);

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  subdivision_id UUID REFERENCES oc_subdivisions(id) ON DELETE SET NULL,
  lot_number TEXT NOT NULL,
  unit_address TEXT,
  entitlements INTEGER NOT NULL DEFAULT 1,
  liabilities INTEGER NOT NULL DEFAULT 1,
  parking TEXT,
  storage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(oc_id, lot_number)
);

CREATE INDEX idx_lots_oc ON lots(oc_id);
CREATE INDEX idx_lots_subdivision ON lots(subdivision_id);
CREATE INDEX idx_lots_lot_number ON lots(oc_id, lot_number);

CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mailing_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_people_oc ON people(oc_id);
CREATE INDEX idx_people_name_trgm ON people USING gin(full_name gin_trgm_ops);

CREATE TABLE lot_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role occupancy_type NOT NULL DEFAULT 'owner',
  ownership_share_percent NUMERIC(5,2) DEFAULT 100,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  property_manager_id UUID REFERENCES people(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(lot_id, person_id, role)
);

CREATE INDEX idx_lot_people_lot ON lot_people(lot_id);
CREATE INDEX idx_lot_people_person ON lot_people(person_id);

CREATE TABLE committee_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  term_start DATE NOT NULL,
  term_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_committee_terms_oc ON committee_terms(oc_id);

CREATE TABLE committee_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_term_id UUID NOT NULL REFERENCES committee_terms(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  position committee_position NOT NULL,
  lot_id UUID REFERENCES lots(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_committee_members_term ON committee_members(committee_term_id);

-- =============================================================================
-- FINANCE TABLES
-- =============================================================================

CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fund_type fund_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(oc_id, fund_type)
);

CREATE INDEX idx_funds_oc ON funds(oc_id);

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  bsb TEXT,
  account_number_encrypted TEXT, -- encrypted at rest
  bank_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bank_accounts_oc ON bank_accounts(oc_id);

CREATE TABLE chart_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- income, expense, asset, liability, equity
  parent_id UUID REFERENCES chart_accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(oc_id, code)
);

CREATE INDEX idx_chart_accounts_oc ON chart_accounts(oc_id);

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  balance_after NUMERIC(12,2),
  external_id TEXT, -- for deduplication
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_reconciled ON bank_transactions(reconciled_at);
CREATE INDEX idx_bank_transactions_external ON bank_transactions(external_id);

CREATE TABLE transaction_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  chart_account_id UUID REFERENCES chart_accounts(id),
  invoice_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_transaction_allocations_txn ON transaction_allocations(bank_transaction_id);

CREATE TABLE levy_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, published
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_levy_runs_oc ON levy_runs(oc_id);

CREATE TABLE levy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  interest_rate_per_annum NUMERIC(5,2) DEFAULT 10,
  reminder_days INTEGER[] DEFAULT ARRAY[7, 14, 30],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(oc_id)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  levy_run_id UUID REFERENCES levy_runs(id) ON DELETE SET NULL,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(oc_id, invoice_number)
);

CREATE INDEX idx_invoices_oc ON invoices(oc_id);
CREATE INDEX idx_invoices_lot ON invoices(lot_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(oc_id, invoice_number);

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  reference TEXT,
  status payment_status NOT NULL DEFAULT 'completed',
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_oc ON payments(oc_id);

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, payment_id)
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_payment ON invoice_payments(payment_id);

ALTER TABLE transaction_allocations ADD CONSTRAINT fk_transaction_allocations_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- =============================================================================
-- MEETINGS TABLES
-- =============================================================================

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  meeting_type meeting_type NOT NULL,
  title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, notice_sent, completed, minutes_finalized
  pack_pdf_url TEXT,
  minutes_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_meetings_oc ON meetings(oc_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date);

CREATE TABLE meeting_agenda_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL, -- notice, motion, report
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_meeting_agenda_meeting ON meeting_agenda_items(meeting_id);

CREATE TABLE meeting_motions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agenda_item_id UUID NOT NULL REFERENCES meeting_agenda_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  proposer_id UUID REFERENCES people(id),
  seconder_id UUID REFERENCES people(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE meeting_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES meeting_agenda_items(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_meeting_attachments_meeting ON meeting_attachments(meeting_id);

CREATE TABLE meeting_minutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  content JSONB NOT NULL, -- structured minutes
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE meeting_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL, -- present, apology, absent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, person_id)
);

CREATE INDEX idx_meeting_attendance_meeting ON meeting_attendance(meeting_id);

CREATE TABLE meeting_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motion_id UUID NOT NULL REFERENCES meeting_motions(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  vote TEXT NOT NULL, -- for, against, abstain
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(motion_id, person_id)
);

CREATE INDEX idx_meeting_votes_motion ON meeting_votes(motion_id);

-- =============================================================================
-- DOCS / COMMS / AUDIT
-- =============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES oc(id) ON DELETE CASCADE,
  folder document_folder NOT NULL DEFAULT 'general',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  meeting_id UUID REFERENCES meetings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_oc ON documents(oc_id);
CREATE INDEX idx_documents_folder ON documents(folder);

CREATE TABLE document_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_document_links_token ON document_links(token);

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID REFERENCES oc(id) ON DELETE CASCADE, -- null = platform default
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_email_templates_oc ON email_templates(oc_id);

CREATE TABLE email_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID REFERENCES oc(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  resend_id TEXT,
  invoice_id UUID REFERENCES invoices(id),
  meeting_id UUID REFERENCES meetings(id),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_email_outbox_oc ON email_outbox(oc_id);
CREATE INDEX idx_email_outbox_status ON email_outbox(status);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID REFERENCES oc(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_oc ON audit_log(oc_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- =============================================================================
-- INVOICE NUMBER SEQUENCE (per OC)
-- =============================================================================

CREATE TABLE invoice_sequences (
  oc_id UUID PRIMARY KEY REFERENCES oc(id) ON DELETE CASCADE,
  next_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER management_companies_updated_at BEFORE UPDATE ON management_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_profile_updated_at BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER oc_updated_at BEFORE UPDATE ON oc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER oc_subdivisions_updated_at BEFORE UPDATE ON oc_subdivisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lots_updated_at BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER people_updated_at BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lot_people_updated_at BEFORE UPDATE ON lot_people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER committee_terms_updated_at BEFORE UPDATE ON committee_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER committee_members_updated_at BEFORE UPDATE ON committee_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER funds_updated_at BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER chart_accounts_updated_at BEFORE UPDATE ON chart_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bank_transactions_updated_at BEFORE UPDATE ON bank_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transaction_allocations_updated_at BEFORE UPDATE ON transaction_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER levy_runs_updated_at BEFORE UPDATE ON levy_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER levy_rules_updated_at BEFORE UPDATE ON levy_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meeting_agenda_items_updated_at BEFORE UPDATE ON meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meeting_motions_updated_at BEFORE UPDATE ON meeting_motions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
