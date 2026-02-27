-- StrataPilot Seed Data
-- Demo OC with lots, owners, levy run, meeting
-- Run after migrations. Requires auth.users entry - use Supabase dashboard or auth signup first.

-- Note: Replace the UUIDs below with actual auth user IDs from your Supabase project
-- This seed assumes you have run: INSERT INTO auth.users (...) or signed up a user

-- For local dev, we'll create a placeholder - in production, link to real auth user
DO $$
DECLARE
  v_mgmt_id UUID;
  v_oc_id UUID;
  v_subdivision_id UUID;
  v_lot1_id UUID;
  v_lot2_id UUID;
  v_lot3_id UUID;
  v_person1_id UUID;
  v_person2_id UUID;
  v_person3_id UUID;
  v_admin_fund_id UUID;
  v_capital_fund_id UUID;
  v_bank_account_id UUID;
  v_levy_run_id UUID;
  v_inv1_id UUID;
  v_inv2_id UUID;
  v_inv3_id UUID;
  v_meeting_id UUID;
  v_agenda_item_id UUID;
  v_user_id UUID;
BEGIN
  -- Get first user from auth if exists, otherwise we'll need to handle
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found. Create a user via Supabase Auth first, then re-run seed.';
    RETURN;
  END IF;

  -- 1. Management Company
  INSERT INTO management_companies (id, name, abn, address)
  VALUES (
    uuid_generate_v4(),
    'StrataPilot Demo Management',
    '12 345 678 901',
    '123 Collins St, Melbourne VIC 3000'
  )
  RETURNING id INTO v_mgmt_id;

  -- 2. User Profile
  INSERT INTO users_profile (id, management_company_id, email, full_name, role)
  VALUES (
    v_user_id,
    v_mgmt_id,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'Demo Manager',
    'strata_manager'
  )
  ON CONFLICT (id) DO UPDATE SET management_company_id = v_mgmt_id, role = 'strata_manager';

  -- 3. OC
  INSERT INTO oc (id, management_company_id, name, plan_number, address, gst_registered, management_start_date, slug, created_by)
  VALUES (
    uuid_generate_v4(),
    v_mgmt_id,
    'Sunrise Apartments',
    'PS 123456',
    '45 Beach Road, St Kilda VIC 3182',
    TRUE,
    '2024-01-01',
    'sunrise-apartments'
  )
  RETURNING id INTO v_oc_id;

  -- 4. User OC Assignment
  INSERT INTO user_oc_assignments (user_id, oc_id)
  VALUES (v_user_id, v_oc_id)
  ON CONFLICT (user_id, oc_id) DO NOTHING;

  -- 5. Subdivision
  INSERT INTO oc_subdivisions (id, oc_id, plan_number, common_property_notes, lot_schedule)
  VALUES (
    uuid_generate_v4(),
    v_oc_id,
    'PS 123456',
    'Common property: foyer, lifts, garden, pool',
    '[{"lot_number":"1","address":"Unit 1","entitlements":50},{"lot_number":"2","address":"Unit 2","entitlements":30},{"lot_number":"3","address":"Unit 3","entitlements":20}]'::jsonb
  )
  RETURNING id INTO v_subdivision_id;

  -- 6. Lots
  INSERT INTO lots (id, oc_id, subdivision_id, lot_number, unit_address, entitlements, liabilities, parking, storage)
  VALUES
    (uuid_generate_v4(), v_oc_id, v_subdivision_id, '1', 'Unit 1, 45 Beach Road', 50, 50, 'P1', 'S1'),
    (uuid_generate_v4(), v_oc_id, v_subdivision_id, '2', 'Unit 2, 45 Beach Road', 30, 30, 'P2', NULL),
    (uuid_generate_v4(), v_oc_id, v_subdivision_id, '3', 'Unit 3, 45 Beach Road', 20, 20, NULL, 'S3');

  SELECT id INTO v_lot1_id FROM lots WHERE oc_id = v_oc_id AND lot_number = '1';
  SELECT id INTO v_lot2_id FROM lots WHERE oc_id = v_oc_id AND lot_number = '2';
  SELECT id INTO v_lot3_id FROM lots WHERE oc_id = v_oc_id AND lot_number = '3';

  -- 7. People (Owners)
  INSERT INTO people (id, oc_id, full_name, email, phone, mailing_address)
  VALUES
    (uuid_generate_v4(), v_oc_id, 'John Smith', 'john.smith@example.com', '0412 345 678', '45 Beach Road, Unit 1, St Kilda VIC 3182'),
    (uuid_generate_v4(), v_oc_id, 'Jane Doe', 'jane.doe@example.com', '0432 456 789', '45 Beach Road, Unit 2, St Kilda VIC 3182'),
    (uuid_generate_v4(), v_oc_id, 'Bob Wilson', 'bob.wilson@example.com', '0445 678 901', '45 Beach Road, Unit 3, St Kilda VIC 3182');

  SELECT id INTO v_person1_id FROM people WHERE oc_id = v_oc_id AND full_name = 'John Smith';
  SELECT id INTO v_person2_id FROM people WHERE oc_id = v_oc_id AND full_name = 'Jane Doe';
  SELECT id INTO v_person3_id FROM people WHERE oc_id = v_oc_id AND full_name = 'Bob Wilson';

  -- 8. Lot People (Ownership)
  INSERT INTO lot_people (lot_id, person_id, role, ownership_share_percent, is_primary_contact)
  VALUES
    (v_lot1_id, v_person1_id, 'owner', 100, TRUE),
    (v_lot2_id, v_person2_id, 'owner', 100, TRUE),
    (v_lot3_id, v_person3_id, 'owner', 100, TRUE);

  -- 9. Committee
  INSERT INTO committee_terms (id, oc_id, term_start, term_end)
  VALUES (uuid_generate_v4(), v_oc_id, '2024-01-01', '2025-12-31')
  RETURNING id INTO v_agenda_item_id; -- reuse var

  INSERT INTO committee_members (committee_term_id, person_id, position, lot_id)
  VALUES
    (v_agenda_item_id, v_person1_id, 'chair', v_lot1_id),
    (v_agenda_item_id, v_person2_id, 'secretary', v_lot2_id),
    (v_agenda_item_id, v_person3_id, 'treasurer', v_lot3_id);

  -- 10. Funds
  INSERT INTO funds (id, oc_id, name, fund_type)
  VALUES
    (uuid_generate_v4(), v_oc_id, 'Admin Fund', 'admin'),
    (uuid_generate_v4(), v_oc_id, 'Capital Works Fund', 'capital_works');

  SELECT id INTO v_admin_fund_id FROM funds WHERE oc_id = v_oc_id AND fund_type = 'admin';
  SELECT id INTO v_capital_fund_id FROM funds WHERE oc_id = v_oc_id AND fund_type = 'capital_works';

  -- 11. Chart of Accounts
  INSERT INTO chart_accounts (oc_id, fund_id, code, name, account_type)
  VALUES
    (v_oc_id, v_admin_fund_id, '4000', 'Levies Income', 'income'),
    (v_oc_id, v_admin_fund_id, '5000', 'Administration', 'expense'),
    (v_oc_id, v_admin_fund_id, '5100', 'Insurance', 'expense'),
    (v_oc_id, v_capital_fund_id, '4000', 'Levies Income', 'income'),
    (v_oc_id, v_capital_fund_id, '6000', 'Capital Works', 'expense');

  -- 12. Bank Account
  INSERT INTO bank_accounts (id, oc_id, fund_id, name, bsb, account_number_encrypted, bank_name)
  VALUES (
    uuid_generate_v4(),
    v_oc_id,
    v_admin_fund_id,
    'Sunrise Admin Account',
    '063-000',
    '12345678',
    'CBA'
  )
  RETURNING id INTO v_bank_account_id;

  -- 13. Levy Rules
  INSERT INTO levy_rules (oc_id, interest_rate_per_annum, reminder_days)
  VALUES (v_oc_id, 10, ARRAY[7, 14, 30]);

  -- 14. Invoice Sequence
  INSERT INTO invoice_sequences (oc_id, next_number)
  VALUES (v_oc_id, 4)
  ON CONFLICT (oc_id) DO NOTHING;

  -- 15. Levy Run
  INSERT INTO levy_runs (id, oc_id, fund_id, period_start, period_end, due_date, total_amount, status, created_by)
  VALUES (
    uuid_generate_v4(),
    v_oc_id,
    v_admin_fund_id,
    '2025-01-01',
    '2025-03-31',
    '2025-02-15',
    10000,
    'published',
    v_user_id
  )
  RETURNING id INTO v_levy_run_id;

  -- 16. Invoices (split by entitlement: 50%, 30%, 20%)
  INSERT INTO invoices (id, oc_id, levy_run_id, lot_id, invoice_number, status, due_date, total_amount, amount_paid)
  VALUES
    (uuid_generate_v4(), v_oc_id, v_levy_run_id, v_lot1_id, 'INV-001', 'paid', '2025-02-15', 5000, 5000),
    (uuid_generate_v4(), v_oc_id, v_levy_run_id, v_lot2_id, 'INV-002', 'issued', '2025-02-15', 3000, 0),
    (uuid_generate_v4(), v_oc_id, v_levy_run_id, v_lot3_id, 'INV-003', 'overdue', '2025-02-15', 2000, 0);

  SELECT id INTO v_inv1_id FROM invoices WHERE oc_id = v_oc_id AND invoice_number = 'INV-001';
  SELECT id INTO v_inv2_id FROM invoices WHERE oc_id = v_oc_id AND invoice_number = 'INV-002';
  SELECT id INTO v_inv3_id FROM invoices WHERE oc_id = v_oc_id AND invoice_number = 'INV-003';

  -- 17. Invoice Line Items
  INSERT INTO invoice_line_items (invoice_id, fund_id, description, amount)
  VALUES
    (v_inv1_id, v_admin_fund_id, 'Admin Fund Levy Q1 2025', 5000),
    (v_inv2_id, v_admin_fund_id, 'Admin Fund Levy Q1 2025', 3000),
    (v_inv3_id, v_admin_fund_id, 'Admin Fund Levy Q1 2025', 2000);

  -- 18. Payment for INV-001
  INSERT INTO payments (oc_id, amount, payment_date, reference, status)
  VALUES (v_oc_id, 5000, '2025-02-10', 'John Smith INV-001', 'completed')
  RETURNING id INTO v_agenda_item_id;

  INSERT INTO invoice_payments (invoice_id, payment_id, amount)
  VALUES (v_inv1_id, v_agenda_item_id, 5000);

  -- 19. Bank Transaction (payment received)
  INSERT INTO bank_transactions (bank_account_id, transaction_date, description, amount, transaction_type, balance_after, reconciled_at)
  VALUES (
    v_bank_account_id,
    '2025-02-10',
    'John Smith Levy Payment',
    5000,
    'credit',
    15000,
    NOW()
  );

  -- 20. Meeting
  INSERT INTO meetings (id, oc_id, meeting_type, title, meeting_date, location, status, created_by)
  VALUES (
    uuid_generate_v4(),
    v_oc_id,
    'agm',
    'Annual General Meeting 2025',
    '2025-03-15 10:00:00+11',
    'Building Common Room',
    'draft',
    v_user_id
  )
  RETURNING id INTO v_meeting_id;

  INSERT INTO meeting_agenda_items (meeting_id, sort_order, item_type, title, description)
  VALUES
    (v_meeting_id, 1, 'notice', 'Welcome and Apologies', 'Chair to open meeting'),
    (v_meeting_id, 2, 'motion', 'Adoption of Previous Minutes', 'Motion to adopt AGM 2024 minutes'),
    (v_meeting_id, 3, 'report', 'Treasurer Report', 'Q1 2025 financial summary')
  RETURNING id INTO v_agenda_item_id;

  SELECT id INTO v_agenda_item_id FROM meeting_agenda_items WHERE meeting_id = v_meeting_id AND sort_order = 2 LIMIT 1;
  INSERT INTO meeting_motions (agenda_item_id, title, description, proposer_id, seconder_id)
  VALUES (v_agenda_item_id, 'Adopt AGM 2024 Minutes', 'That the minutes of the 2024 AGM be adopted.', v_person1_id, v_person2_id);

  -- 21. Email Templates (platform default)
  INSERT INTO email_templates (oc_id, name, subject, body_html)
  VALUES
    (NULL, 'levy_notice', 'Your Levy Notice - {{oc_name}}', '<p>Dear {{owner_name}},</p><p>Please find your levy notice for {{period}} attached.</p><p>Due date: {{due_date}}</p><p>Amount: {{amount}}</p>'),
    (NULL, 'levy_reminder', 'Reminder: Overdue Levy - {{oc_name}}', '<p>Dear {{owner_name}},</p><p>Your levy of {{amount}} for {{period}} was due on {{due_date}} and is now overdue.</p><p>Please arrange payment as soon as possible.</p>'),
    (NULL, 'meeting_notice', 'Meeting Notice: {{meeting_title}}', '<p>Dear {{owner_name}},</p><p>You are invited to {{meeting_title}} on {{meeting_date}}.</p><p>Location: {{location}}</p><p>Please find the meeting pack attached.</p>');

  -- 22. Audit Log
  INSERT INTO audit_log (oc_id, user_id, action, entity_type, entity_id)
  VALUES
    (v_oc_id, v_user_id, 'create', 'oc', v_oc_id),
    (v_oc_id, v_user_id, 'create', 'levy_run', v_levy_run_id),
    (v_oc_id, v_user_id, 'create', 'meeting', v_meeting_id);

  RAISE NOTICE 'Seed completed successfully. OC: Sunrise Apartments (sunrise-apartments)';
END $$;
