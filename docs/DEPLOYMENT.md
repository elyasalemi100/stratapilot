# StrataPilot Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (or similar)
- Resend account (for email)

---

## 1. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Note your project URL and anon key from Settings → API
3. Run migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link project (or use local dev)
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

4. Or manually run the SQL in `supabase/migrations/` in the Supabase SQL editor

5. Enable Email auth in Authentication → Providers

6. Create a user via the Supabase dashboard or signup flow

7. Run seed (after creating at least one auth user):

```bash
supabase db seed
```

Or run `supabase/seed.sql` manually in the SQL editor.

---

## 2. Environment Variables

Create `.env.local` (for local dev) and set in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `RESEND_API_KEY` | Resend API key for email | `re_...` |
| `RESEND_FROM_EMAIL` | From address for emails | `StrataPilot <noreply@yourdomain.com>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (webhooks, share links) | `eyJ...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_*` | Stripe price IDs for plans | `price_...` |
| `CRON_SECRET` | Secret for cron endpoints (optional) | Random string |

**Storage:** Create a `documents` bucket in Supabase Dashboard (Storage) - private, 50MB limit. Allowed MIME types: pdf, jpeg, png, gif, webp, doc, docx, xls, xlsx.

---

## 3. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Set `RESEND_FROM_EMAIL` to a verified sender

---

## 4. Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
vercel
```

---

## 5. Post-Deploy: Create Management Company & User Profile

After first user signs up, run in Supabase SQL:

```sql
-- Create management company
INSERT INTO management_companies (name, abn, address)
VALUES ('Your Company', '12 345 678 901', 'Your Address');

-- Link user to company (replace USER_ID with auth.users.id)
INSERT INTO users_profile (id, management_company_id, email, full_name, role)
SELECT 
  id,
  (SELECT id FROM management_companies LIMIT 1),
  email,
  raw_user_meta_data->>'full_name',
  'strata_manager'
FROM auth.users
WHERE id = 'USER_ID'
ON CONFLICT (id) DO UPDATE SET management_company_id = EXCLUDED.management_company_id;
```

---

## 6. Cron / Background Jobs (Optional)

For levy reminders, add a Vercel Cron (Pro plan) or external cron:

**vercel.json:**

```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

**api/cron/reminders/route.ts:**

```ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Query overdue invoices, send reminders via Resend
  return NextResponse.json({ ok: true });
}
```

---

## 7. Storage (Supabase Storage)

Create buckets for documents:

- `documents` – OC documents
- `receipts` – Receipt attachments

Enable RLS on storage objects.

---

## 8. Monitoring

- Vercel: Built-in logs and analytics
- Supabase: Dashboard → Logs
- Resend: Dashboard for delivery status

---

## Quick Start (Local)

```bash
npm install
cp .env.example .env.local
# Fill in Supabase URL and anon key
npm run dev
```

Create a user at `/signup`, then run the seed SQL to create demo data.
