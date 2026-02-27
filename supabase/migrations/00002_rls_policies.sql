-- StrataPilot RLS Policies
-- Row Level Security for all tables

-- =============================================================================
-- HELPER FUNCTIONS (public schema - auth schema is restricted in Supabase)
-- =============================================================================

-- Get current user's profile (cached in request)
CREATE OR REPLACE FUNCTION public.user_profile()
RETURNS users_profile AS $$
  SELECT * FROM users_profile WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is platform super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() AND role = 'platform_super_admin' AND deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user has access to OC (via assignment or management_admin)
CREATE OR REPLACE FUNCTION public.user_has_oc_access(p_oc_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM users_profile up
    JOIN oc o ON o.management_company_id = up.management_company_id
    WHERE up.id = auth.uid() AND up.deleted_at IS NULL
      AND o.id = p_oc_id
      AND up.role IN ('management_admin', 'strata_manager')
  )
  OR EXISTS (
    SELECT 1 FROM user_oc_assignments uoa
    WHERE uoa.user_id = auth.uid() AND uoa.oc_id = p_oc_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is lot owner for a given lot
CREATE OR REPLACE FUNCTION public.user_is_lot_owner(p_lot_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile up
    JOIN people p ON p.email = up.email AND p.deleted_at IS NULL
    JOIN lot_people lp ON lp.person_id = p.id AND lp.lot_id = p_lot_id AND lp.deleted_at IS NULL
    WHERE up.id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is committee member for OC
CREATE OR REPLACE FUNCTION public.user_is_committee_member(p_oc_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile up
    JOIN people p ON p.email = up.email AND p.deleted_at IS NULL
    JOIN committee_members cm ON cm.person_id = p.id AND cm.deleted_at IS NULL
    JOIN committee_terms ct ON ct.id = cm.committee_term_id AND ct.deleted_at IS NULL
    WHERE up.id = auth.uid() AND ct.oc_id = p_oc_id
      AND ct.term_start <= CURRENT_DATE AND ct.term_end >= CURRENT_DATE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get OC id from various entity types
CREATE OR REPLACE FUNCTION public.get_oc_id_from_entity(p_entity_type TEXT, p_entity_id UUID)
RETURNS UUID AS $$
BEGIN
  CASE p_entity_type
    WHEN 'oc' THEN RETURN p_entity_id;
    WHEN 'lot' THEN RETURN (SELECT oc_id FROM lots WHERE id = p_entity_id);
    WHEN 'person' THEN RETURN (SELECT oc_id FROM people WHERE id = p_entity_id);
    WHEN 'invoice' THEN RETURN (SELECT oc_id FROM invoices WHERE id = p_entity_id);
    WHEN 'meeting' THEN RETURN (SELECT oc_id FROM meetings WHERE id = p_entity_id);
    WHEN 'document' THEN RETURN (SELECT oc_id FROM documents WHERE id = p_entity_id);
    WHEN 'bank_account' THEN RETURN (SELECT oc_id FROM bank_accounts WHERE id = p_entity_id);
    WHEN 'fund' THEN RETURN (SELECT oc_id FROM funds WHERE id = p_entity_id);
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE management_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE oc ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oc_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE oc_subdivisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE levy_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE levy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MANAGEMENT COMPANIES
-- =============================================================================

CREATE POLICY "Super admin full access" ON management_companies
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users see own company" ON management_companies
  FOR SELECT USING (
    id IN (SELECT management_company_id FROM users_profile WHERE id = auth.uid() AND deleted_at IS NULL)
  );

CREATE POLICY "Management admin can update own company" ON management_companies
  FOR UPDATE USING (
    id IN (SELECT management_company_id FROM users_profile WHERE id = auth.uid() AND role = 'management_admin' AND deleted_at IS NULL)
  );

-- =============================================================================
-- USERS PROFILE
-- =============================================================================

CREATE POLICY "Users see own profile" ON users_profile
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON users_profile
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Super admin full access" ON users_profile
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Management admin sees company users" ON users_profile
  FOR SELECT USING (
    management_company_id IN (SELECT management_company_id FROM users_profile WHERE id = auth.uid() AND role IN ('management_admin', 'management_admin') AND deleted_at IS NULL)
  );

-- =============================================================================
-- OC
-- =============================================================================

CREATE POLICY "OC select by access" ON oc
  FOR SELECT USING (
    public.is_super_admin() OR public.user_has_oc_access(id)
  );

CREATE POLICY "OC insert by management" ON oc
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR (
      management_company_id IN (SELECT management_company_id FROM users_profile WHERE id = auth.uid() AND role IN ('management_admin', 'strata_manager') AND deleted_at IS NULL)
    )
  );

CREATE POLICY "OC update by access" ON oc
  FOR UPDATE USING (public.user_has_oc_access(id));

CREATE POLICY "OC delete by super admin" ON oc
  FOR DELETE USING (public.is_super_admin());

-- =============================================================================
-- USER OC ASSIGNMENTS
-- =============================================================================

CREATE POLICY "User OC assignments by access" ON user_oc_assignments
  FOR ALL USING (
    public.is_super_admin() OR public.user_has_oc_access(oc_id) OR user_id = auth.uid()
  );

-- =============================================================================
-- OC SUBDIVISIONS
-- =============================================================================

CREATE POLICY "OC subdivisions by OC access" ON oc_subdivisions
  FOR ALL USING (public.user_has_oc_access(oc_id));

-- =============================================================================
-- LOTS
-- =============================================================================

CREATE POLICY "Lots by OC access or owner" ON lots
  FOR SELECT USING (
    public.user_has_oc_access(oc_id) OR public.user_is_lot_owner(id)
  );

CREATE POLICY "Lots insert/update by OC access" ON lots
  FOR INSERT WITH CHECK (public.user_has_oc_access(oc_id));

CREATE POLICY "Lots update by OC access" ON lots
  FOR UPDATE USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Lots delete by OC access" ON lots
  FOR DELETE USING (public.user_has_oc_access(oc_id));

-- =============================================================================
-- PEOPLE
-- =============================================================================

CREATE POLICY "People by OC access or own lot" ON people
  FOR SELECT USING (
    public.user_has_oc_access(oc_id) OR
    id IN (SELECT lp.person_id FROM lot_people lp JOIN lots l ON l.id = lp.lot_id WHERE public.user_is_lot_owner(l.id))
  );

CREATE POLICY "People insert/update by OC access" ON people
  FOR ALL USING (public.user_has_oc_access(oc_id));

-- =============================================================================
-- LOT PEOPLE
-- =============================================================================

CREATE POLICY "Lot people by lot access" ON lot_people
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM lots WHERE id = lot_id)) OR
    public.user_is_lot_owner(lot_id)
  );

-- =============================================================================
-- COMMITTEE TERMS & MEMBERS
-- =============================================================================

CREATE POLICY "Committee terms by OC access" ON committee_terms
  FOR ALL USING (public.user_has_oc_access(oc_id) OR public.user_is_committee_member(oc_id));

CREATE POLICY "Committee members by OC access" ON committee_members
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM committee_terms WHERE id = committee_term_id)) OR
    public.user_is_committee_member((SELECT oc_id FROM committee_terms WHERE id = committee_term_id))
  );

-- =============================================================================
-- FINANCE TABLES
-- =============================================================================

CREATE POLICY "Funds by OC access" ON funds
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Bank accounts by OC access" ON bank_accounts
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Chart accounts by OC access" ON chart_accounts
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Bank transactions by account access" ON bank_transactions
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM bank_accounts WHERE id = bank_account_id))
  );

CREATE POLICY "Transaction allocations by transaction access" ON transaction_allocations
  FOR ALL USING (
    public.user_has_oc_access((
      SELECT ba.oc_id FROM bank_transactions bt
      JOIN bank_accounts ba ON ba.id = bt.bank_account_id
      WHERE bt.id = bank_transaction_id
    ))
  );

CREATE POLICY "Levy runs by OC access" ON levy_runs
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Levy rules by OC access" ON levy_rules
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Invoices by OC access or owner" ON invoices
  FOR SELECT USING (
    public.user_has_oc_access(oc_id) OR public.user_is_lot_owner(lot_id)
  );

CREATE POLICY "Invoices insert/update by OC access" ON invoices
  FOR INSERT WITH CHECK (public.user_has_oc_access(oc_id));

CREATE POLICY "Invoices update by OC access" ON invoices
  FOR UPDATE USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Invoice line items by invoice access" ON invoice_line_items
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM invoices WHERE id = invoice_id))
  );

CREATE POLICY "Payments by OC access" ON payments
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Invoice payments by invoice access" ON invoice_payments
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM invoices WHERE id = invoice_id))
  );

-- =============================================================================
-- MEETINGS
-- =============================================================================

CREATE POLICY "Meetings by OC access or committee" ON meetings
  FOR SELECT USING (
    public.user_has_oc_access(oc_id) OR public.user_is_committee_member(oc_id)
  );

CREATE POLICY "Meetings insert/update by OC access" ON meetings
  FOR ALL USING (public.user_has_oc_access(oc_id));

CREATE POLICY "Meeting agenda items by meeting access" ON meeting_agenda_items
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM meetings WHERE id = meeting_id))
  );

CREATE POLICY "Meeting motions by agenda access" ON meeting_motions
  FOR ALL USING (
    public.user_has_oc_access((
      SELECT m.oc_id FROM meeting_agenda_items mai
      JOIN meetings m ON m.id = mai.meeting_id
      WHERE mai.id = agenda_item_id
    ))
  );

CREATE POLICY "Meeting attachments by meeting access" ON meeting_attachments
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM meetings WHERE id = meeting_id))
  );

CREATE POLICY "Meeting minutes by meeting access" ON meeting_minutes
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM meetings WHERE id = meeting_id))
  );

CREATE POLICY "Meeting attendance by meeting access" ON meeting_attendance
  FOR ALL USING (
    public.user_has_oc_access((SELECT oc_id FROM meetings WHERE id = meeting_id))
  );

CREATE POLICY "Meeting votes by motion access" ON meeting_votes
  FOR ALL USING (
    public.user_has_oc_access((
      SELECT m.oc_id FROM meeting_motions mm
      JOIN meeting_agenda_items mai ON mai.id = mm.agenda_item_id
      JOIN meetings m ON m.id = mai.meeting_id
      WHERE mm.id = motion_id
    ))
  );

-- =============================================================================
-- DOCUMENTS
-- =============================================================================

CREATE POLICY "Documents by OC access" ON documents
  FOR ALL USING (public.user_has_oc_access(oc_id));

-- Document links: no direct RLS - access via server action with token validation

-- =============================================================================
-- EMAIL
-- =============================================================================

CREATE POLICY "Email templates by OC access" ON email_templates
  FOR ALL USING (oc_id IS NULL OR public.user_has_oc_access(oc_id));

CREATE POLICY "Email outbox by OC access" ON email_outbox
  FOR ALL USING (oc_id IS NULL OR public.user_has_oc_access(oc_id));

-- =============================================================================
-- AUDIT LOG
-- =============================================================================

CREATE POLICY "Audit log by OC access" ON audit_log
  FOR SELECT USING (
    public.is_super_admin() OR oc_id IS NULL OR public.user_has_oc_access(oc_id)
  );

CREATE POLICY "Audit log insert by authenticated" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- INVOICE SEQUENCES
-- =============================================================================

CREATE POLICY "Invoice sequences by OC access" ON invoice_sequences
  FOR ALL USING (public.user_has_oc_access(oc_id));
