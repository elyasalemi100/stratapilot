# StrataPilot — Technical Plan

---

## 1. Stack Decision & Justification

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Frontend** | Next.js 15 App Router + TypeScript | Fastest path to production; server components reduce client bundle; built-in API routes; Vercel-optimized |
| **UI** | Tailwind + shadcn/ui + Lucide | Rapid, consistent UI; shadcn is copy-paste (no lock-in); Lucide is lightweight, tree-shakeable |
| **DB/Auth/Storage** | Supabase (Postgres + Auth + Storage) | Single vendor for DB, RLS, auth, storage; real-time optional; generous free tier; excellent DX |
| **Email** | Resend | Modern API, templates, deliverability; simple integration; AU-friendly |
| **PDF** | @react-pdf/renderer | Server-side React components → PDF; no headless browser; works in serverless; consistent styling with app |
| **Background Jobs** | Supabase Edge Functions + pg_cron | No extra vendor; pg_cron for scheduled (reminders, reports); Edge Functions for async (email, PDF); keeps stack minimal |
| **ORM** | Drizzle ORM | Lightweight, type-safe, works well with Supabase; no RLS fighting; migrations in SQL when needed |

**Deviations considered:**

- **Prisma:** Rejected—RLS + Prisma can conflict; Drizzle is lighter and Supabase-native
- **Playwright/Chromium PDF:** Rejected—heavier, cold starts in serverless; react-pdf is deterministic and fast
- **Trigger.dev:** Could add later for complex queues; for V1, Edge Functions + cron suffice

---

## 2. Architecture Overview

```
/workspace
├── app/
│   ├── (auth)/                    # Auth routes (login, signup, callback)
│   ├── (dashboard)/               # Main app layout with sidebar
│   │   ├── layout.tsx
│   │   ├── [ocSlug]/              # OC-scoped routes
│   │   │   ├── dashboard/
│   │   │   ├── lots/
│   │   │   ├── levies/
│   │   │   ├── banking/
│   │   │   ├── meetings/
│   │   │   ├── documents/
│   │   │   ├── communications/
│   │   │   ├── compliance/
│   │   │   └── settings/
│   │   ├── portfolio/             # All OCs
│   │   └── admin/                 # Platform admin
│   ├── api/                       # API routes (webhooks, cron)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn components
│   ├── layout/                    # Sidebar, OC switcher, top bar
│   ├── wizards/                   # Setup wizard, levy run wizard
│   ├── tables/                   # Data tables with filters
│   └── forms/                    # Form components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   ├── permissions.ts
│   │   └── rls-helpers.ts
│   ├── actions/                  # Server actions
│   ├── utils/
│   │   ├── audit.ts
│   │   ├── pdf.ts
│   │   └── email.ts
│   └── validations/               # Zod schemas
├── supabase/
│   ├── migrations/
│   └── functions/                 # Edge Functions
├── types/
└── docs/
```

### Patterns

- **Server Components** by default; Client Components only for interactivity (forms, wizards, tables)
- **Server Actions** for mutations (create, update, delete); no public API for sensitive ops
- **Middleware** for auth check, redirect unauthenticated
- **RLS** on all tables; server uses service role only when necessary (e.g. cron)
- **Optimistic UI** for non-critical updates (e.g. toggle); critical ops show loading

---

## 3. Auth Approach

- **Supabase Auth** with email/password (magic link optional)
- **users_profile** table links `auth.users.id` to `management_company_id`, `role`
- **OC access** via `oc_users` (or `user_oc_assignments`) for strata managers; owners/committee via `lot_people` / `committee_members`
- **Session** from `createServerClient` in server components; `createBrowserClient` in client
- **Middleware** refreshes session, redirects `/login` if unauthenticated
- **Share links** use token in URL; server action validates token, returns doc; no RLS bypass

---

## 4. RLS Strategy

- **Every table** has RLS enabled
- **Policies** check:
  - `auth.uid()` exists
  - User's `management_company_id` matches row's OC's management company
  - User's role permits action (read/write)
  - For owner-scoped: user's `people.id` matches `lot_people.person_id` for that lot
- **Service role** used only for:
  - Migrations
  - Cron jobs (levy reminders, reports)
  - Edge Functions that need to bypass user context
- **Avoid** `public` schema reads from client; use server actions that call Supabase with user's JWT

---

## 5. Background Job Strategy

| Job | Trigger | Implementation |
|-----|---------|----------------|
| Levy reminders (7, 14, 30 days) | Daily cron | pg_cron → Edge Function or API route with service key |
| Bank reconciliation report | On-demand | Server action |
| Meeting pack PDF | On-demand | Server action → react-pdf |
| Levy notice emails | On-demand (bulk) | Server action → Resend (batch) |
| Audit log aggregation | Optional weekly | pg_cron |

**Cron setup:** Vercel Cron (if on Pro) or external cron (e.g. cron-job.org) hitting `/api/cron/reminders` with `CRON_SECRET`.

---

## 6. PDF Generation Approach

- **Library:** `@react-pdf/renderer`
- **Flow:** Server action receives data → renders React-PDF document → returns Buffer → save to Supabase Storage or stream to response
- **Templates:** Reusable components (InvoicePDF, MeetingPackPDF, MinutesPDF, OCProfilePDF)
- **Styling:** Consistent fonts (e.g. Inter), colours, layout; AU date/currency format
- **Serverless:** React-PDF is pure JS; no Chromium; works in Vercel serverless

---

## 7. File Structure (Exact)

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
    callback/route.ts
  (dashboard)/
    layout.tsx
    page.tsx                    # Redirect to first OC or portfolio
    [ocSlug]/
      layout.tsx
      dashboard/page.tsx
      lots/page.tsx
      lots/[lotId]/page.tsx
      owners/page.tsx
      committee/page.tsx
      levies/page.tsx
      levies/runs/page.tsx
      levies/runs/new/page.tsx
      levies/invoices/page.tsx
      levies/arrears/page.tsx
      banking/page.tsx
      banking/import/page.tsx
      banking/reconciliation/page.tsx
      meetings/page.tsx
      meetings/[meetingId]/page.tsx
      meetings/[meetingId]/minutes/page.tsx
      documents/page.tsx
      communications/page.tsx
      compliance/page.tsx
      settings/page.tsx
      setup/page.tsx             # OC Setup Wizard
    portfolio/page.tsx
    admin/page.tsx
  api/
    cron/
      reminders/route.ts
    webhooks/
      resend/route.ts
  layout.tsx
  globals.css

components/
  ui/                            # shadcn
  layout/
    sidebar.tsx
    oc-switcher.tsx
    top-bar.tsx
    command-palette.tsx
  wizards/
    oc-setup-wizard.tsx
    levy-run-wizard.tsx
  tables/
    data-table.tsx
  forms/

lib/
  supabase/
    client.ts
    server.ts
    middleware.ts
  auth/
    permissions.ts
    get-session.ts
  actions/
    oc-actions.ts
    levy-actions.ts
    banking-actions.ts
    meeting-actions.ts
    document-actions.ts
  utils/
    audit.ts
    pdf/
      invoice-pdf.tsx
      meeting-pack-pdf.tsx
      minutes-pdf.tsx
      oc-profile-pdf.tsx
    email.ts
  validations/

supabase/
  migrations/
    00001_initial_schema.sql
    00002_rls_policies.sql
  seed.sql
  functions/
    send-levy-reminder/
```

---

*End of Technical Plan*
