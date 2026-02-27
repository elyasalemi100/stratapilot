# StrataPilot — Product Specification

**Working Name:** StrataPilot  
**Version:** 1.0  
**Target Market:** Australian Strata Management

---

## 1. Personas

### Primary Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Strata Manager** | Professional managing multiple OCs for a management company | Efficient workflows, bulk operations, reporting, compliance, multi-OC switching |
| **Committee Member** | Chair, Secretary, Treasurer, or general member of OC committee | Limited access to committee docs, meetings, approvals, financial summaries |
| **Lot Owner** | Individual who owns one or more lots | View levies, pay online, download invoices, access meeting packs, contact details |

### Secondary Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Tenant** | Renting a lot | Read-only levy visibility (if permitted), payment instructions for landlord |
| **Property Manager** | Manages rental on behalf of owner | Same as tenant + communication channel |
| **Read-Only Auditor** | External auditor or regulator | Audit logs, data export, no write access |
| **Management Admin** | Company-level admin | User management, OC assignment, billing, platform settings |

---

## 2. Core Value Proposition

**StrataPilot** is the all-in-one strata management platform for Australian Owners Corporations. It replaces fragmented spreadsheets, legacy software, and manual processes with:

- **Single source of truth** for OC structure, lots, entitlements, and ownership
- **Automated levy lifecycle** from budget → invoice → PDF → email → reconciliation
- **Professional meeting packs** and minutes with one-click distribution
- **Bank reconciliation** with CSV import and smart matching
- **Enterprise security** with RLS, audit logs, and role-based access

---

## 3. Initial V1 Scope

### In Scope (V1)

- Multi-OC management under one management company
- Full OC + subdivision + lot + ownership setup wizard
- Levy generation engine with PDF invoices and Resend email
- Bank CSV import + reconciliation + auto-match
- Meetings (AGM/EGM/Committee) with agenda, pack PDF, minutes, email
- Document library with folder tags and share links
- Email templates and comms log
- Audit logging, soft delete, approvals for levy run and minutes
- Owner portal (levies, invoices, payment instructions)
- Arrears dashboard with reminders
- Reports: reconciled vs unreconciled, bank vs ledger, income/expense by fund, arrears

### Out of Scope (V1)

- Direct bank feed API integrations (use CSV import)
- Online payment gateway (show bank details for BPAY/EFT)
- Mobile native app (responsive web only)
- Work orders / maintenance tracking
- Insurance management
- By-laws library (future)

---

## 4. Left Navbar Information Architecture (Final)

```
┌─────────────────────────────────────────┐
│ [OC Switcher ▼]  StrataPilot             │
├─────────────────────────────────────────┤
│ 🔍 Search OC, lot, owner, invoice...     │
├─────────────────────────────────────────┤
│ OVERVIEW                                 │
│   Dashboard                              │
│   Quick Actions                          │
├─────────────────────────────────────────┤
│ PORTFOLIO                                │
│   All OCs                                │
│   OC Profile                             │
├─────────────────────────────────────────┤
│ LOTS & MEMBERSHIPS                       │
│   Lots                                   │
│   Owners & Occupants                     │
│   Committee                              │
├─────────────────────────────────────────┤
│ LEVIES                                   │
│   Levy Runs [badge: drafts]              │
│   Invoices                               │
│   Arrears [badge: count]                 │
├─────────────────────────────────────────┤
│ BANKING & RECONCILIATION                 │
│   Bank Accounts                          │
│   Transactions                           │
│   Reconciliation [badge: unreconciled]   │
├─────────────────────────────────────────┤
│ REPORTS                                  │
│   Financial Reports                      │
│   Levy Reports                           │
│   Arrears Report                         │
├─────────────────────────────────────────┤
│ MEETINGS                                 │
│   Meeting Register                       │
│   Upcoming Meetings                      │
├─────────────────────────────────────────┤
│ DOCUMENTS                                │
│   Document Library                       │
│   Share Links                            │
├─────────────────────────────────────────┤
│ COMMUNICATIONS                           │
│   Email Templates                        │
│   Comms Log                              │
├─────────────────────────────────────────┤
│ COMPLIANCE                               │
│   Audit Log                              │
│   Approvals                              │
│   Data Export                            │
├─────────────────────────────────────────┤
│ SETTINGS                                 │
│   OC Settings                            │
│   Financial Setup                        │
│   Users & Permissions                    │
├─────────────────────────────────────────┤
│ ADMIN (role-gated)                       │
│   Management Company                     │
│   Platform Settings                      │
└─────────────────────────────────────────┘
```

### Quick Actions (Floating / Top Bar)

- **New levy run**
- **Import bank CSV**
- **Schedule meeting**
- **Send arrears reminder**

### OC Switcher

- Dropdown with OC name + plan number
- Recent OCs at top
- Search within dropdown
- "All OCs" view for portfolio-level reports

### Global Search (Ctrl+K / Cmd+K)

- Search: OC name, plan number, lot number, owner name, invoice number
- Navigate to result
- Quick actions from palette

---

## 5. Key Screens Wireframe Descriptions

### Dashboard (OC-scoped)

- **Hero:** OC name, plan number, next levy due, next meeting
- **Cards:** Arrears count + $, Unreconciled transactions count, Upcoming levies, Upcoming meetings
- **Charts:** Levy collection trend (last 6 months), Bank balance vs ledger
- **Recent activity:** Last 10 audit events
- **Empty state:** "Complete OC setup" CTA if wizard incomplete

### OC Setup Wizard

- **Step 1:** OC details (name, plan, address, ABN, GST, management dates)
- **Step 2:** Subdivisions (plan number, common property notes, lot schedule)
- **Step 3:** Lots (number, address, entitlements, liabilities, parking/storage)
- **Step 4:** Owners & memberships (multi-owner, share %, primary, mailing, occupancy)
- **Step 5:** Committee (positions, terms, permissions)
- **Step 6:** Financial setup (funds, chart of accounts, bank accounts, opening balances, levy defaults)
- **Step 7:** Summary + Generate OC Profile PDF

### Levy Run Creation

- **Step 1:** Select fund(s), period, due date
- **Step 2:** Budget amounts per fund (or use previous)
- **Step 3:** Preview split by entitlement
- **Step 4:** Generate invoices (batch)
- **Step 5:** Review invoices, edit if needed
- **Step 6:** Approve & publish
- **Step 7:** Send via email (bulk Resend + PDF attachment)

### Reconciliation Screen

- **Left:** Unreconciled bank transactions (date, description, amount)
- **Right:** Unmatched invoices / expected payments
- **Center:** Match controls (auto-match, manual match, allocate to COA)
- **Bottom:** Reconciled pairs, status per month
- **Filters:** Date range, fund, account

### Meeting Pack Builder

- **Agenda:** Ordered items with type (notice, motion, report)
- **Motions:** Title, description, proposer, seconder
- **Attachments:** Upload docs, attach to items
- **Preview:** Live PDF preview
- **Actions:** Generate pack PDF, Send notice + pack via email

### Minutes Editor

- **Attendance:** Check-in list (present, apology, absent)
- **Items:** Per agenda item, outcome, votes (for/against/abstain)
- **Motions carried/lost**
- **Action items**
- **Export:** Minutes PDF
- **Send:** Email to owners/committee

---

## 6. Main Workflows Step-by-Step

### Workflow 1: OC + Subdivision Setup

1. Manager creates new OC from Portfolio → Add OC
2. Wizard Step 1: Enter OC name, plan number, address, ABN, GST, management start/end
3. Wizard Step 2: Add subdivision(s), plan numbers, common property notes
4. Wizard Step 3: Define lots (number, unit/address, entitlements, liabilities, parking, storage)
5. Wizard Step 4: For each lot, add owners (name, share %, primary, mailing, email, phone, occupancy)
6. Wizard Step 5: Define committee positions, assign members, set terms
7. Wizard Step 6: Create funds (Admin, Capital Works), chart of accounts, bank accounts, opening balances, levy frequency
8. Wizard Step 7: Review summary, generate OC Profile PDF, complete setup

### Workflow 2: Levy Generation & Distribution

1. Manager → Levies → New Levy Run
2. Select fund(s), period (e.g. Q1 2025), due date
3. Enter budget amounts per fund (or copy from previous run)
4. System splits by unit entitlements, generates invoice records
5. Manager reviews invoices, edits if needed
6. Manager approves levy run (approval workflow)
7. Manager triggers "Send levy notices" → Resend sends email + PDF to each owner
8. Comms log records delivery status
9. Owner portal: owners see invoices, download PDFs, get payment instructions

### Workflow 3: Bank Reconciliation

1. Manager exports bank statement CSV
2. Manager → Banking → Import CSV
3. Map columns (date, description, debit, credit, amount, balance)
4. System creates transactions, dedupes
5. Manager → Reconciliation
6. Auto-match runs (reference, invoice #, owner name)
7. Manager manually matches remaining
8. Manager allocates expenses to chart of accounts, attaches receipts
9. Mark month reconciled
10. Reports show reconciled vs unreconciled, bank vs ledger

### Workflow 4: Meeting Pack & Minutes

1. Manager → Meetings → New Meeting
2. Select type (AGM/EGM/Committee), date, location
3. Build agenda (items, motions, attachments)
4. Generate meeting pack PDF
5. Send meeting notice + pack link via Resend
6. After meeting: open minutes editor
7. Record attendance, outcomes, votes
8. Finalize minutes (approval)
9. Export minutes PDF, email to owners/committee

### Workflow 5: Arrears Reminder

1. Manager → Levies → Arrears
2. View overdue list (lot, owner, amount, days overdue)
3. Select owner(s), click "Send reminder"
4. System uses email template, sends via Resend
5. Comms log records send
6. Option: add note, log call

---

## 7. AU Defaults (Opinionated)

- **Levy frequency:** Quarterly
- **Funds:** Admin Fund, Capital Works Fund (Sinking Fund)
- **Interest on arrears:** Configurable % per annum (e.g. 10%)
- **Reminder schedule:** 7 days, 14 days, 30 days overdue
- **GST:** Configurable per OC (registered vs not)
- **Date format:** DD/MM/YYYY
- **Currency:** AUD

---

*End of Product Spec*
