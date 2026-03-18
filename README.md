# Classaathi

WhatsApp automation + fee collection SaaS platform for tuition centres in India. Built with Next.js 14 (App Router), TypeScript, Supabase, Razorpay, and WhatsApp Business API.

## Features

- **Fee Management** — Auto-generated monthly ledger, partial payments, advance payment carry-over
- **Payment Collection** — Razorpay payment links sent via WhatsApp; manual marking for cash/UPI
- **WhatsApp Automation** — Fee reminders, broadcast messages, owner summary after reminders
- **Multi-tenancy** — Institute-scoped data isolation via Supabase Row-Level Security
- **Role-Based Access** — Owner (full access) and Teacher (restricted to assigned students)
- **Batch Management** — Organize students into batches
- **Attendance Tracking** — Mark and view student attendance
- **Teacher Management** — Invite teachers, assign students, manage permissions
- **Activity Feed** — Real-time log of reminders, payments, broadcasts
- **CSV Import/Export** — Bulk student upload with downloadable template
- **Dark Mode** — Full dark/light theme support
- **Landing Page** — Animated marketing page with pricing, features, and social proof

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + Auth) |
| Payments | Razorpay |
| Messaging | WhatsApp Business API |
| Styling | Tailwind CSS + Framer Motion |
| UI Components | shadcn/ui pattern (CVA + clsx + tailwind-merge) |
| Icons | Lucide React |

## Quick Start

```bash
pnpm install
cp .env.example .env.local
# Fill in your Supabase and Razorpay credentials in .env.local
pnpm run dev
```

The app runs at `http://localhost:3000`.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor to create all tables
3. Run migrations in order from `supabase/migrations/` (001 through 006)
4. Authentication > Providers > Email: enable email sign-up
5. Authentication > URL Configuration > Redirect URLs: add `http://localhost:3000/auth/callback`

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (for webhooks, bypasses RLS) |
| `RAZORPAY_KEY_ID` | For payments | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | For webhook | Razorpay webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Yes | e.g. `http://localhost:3000` or your production domain |

### 3. Razorpay Webhook

1. Razorpay Dashboard > Webhooks > Add webhook
2. URL: `{NEXT_PUBLIC_APP_URL}/api/razorpay/webhook`
3. Events: `payment_link.paid`
4. Copy the signing secret to `RAZORPAY_WEBHOOK_SECRET`

### 4. WhatsApp (Production)

Replace `/api/whatsapp/mock` calls with your WhatsApp Business API provider's endpoint. The expected payload format:

```json
{
  "institute_name": "...",
  "student_name": "...",
  "parent_phone": "...",
  "due_amount": 0,
  "payment_link": "https://..."
}
```

## Scripts

```bash
pnpm run dev       # Development server
pnpm run build     # Production build
pnpm run start     # Start production server
pnpm run lint      # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Authenticated routes
│   │   ├── layout.tsx            # Dashboard layout with navigation
│   │   ├── dashboard/            # Main dashboard, reminders, activity feed
│   │   ├── students/             # Student management, CSV upload, mark paid
│   │   ├── payments/             # Payment history
│   │   ├── attendance/           # Attendance tracking
│   │   ├── broadcast/            # Broadcast messages
│   │   ├── teacher/              # Teacher dashboard
│   │   └── admin/teachers/       # Teacher management (owner only)
│   ├── api/
│   │   ├── auth/                 # login, signup, logout, verify
│   │   ├── students/             # CRUD, CSV upload, template download
│   │   ├── payments/             # Payment listing, manual marking
│   │   ├── reminders/send/       # Send fee reminders
│   │   ├── broadcast/            # Broadcast messages
│   │   ├── batches/              # Batch CRUD, batch students
│   │   ├── members/              # Institute members, current user
│   │   ├── student-teachers/     # Student-teacher mappings
│   │   ├── attendance/           # Attendance API
│   │   ├── activity/recent/      # Recent activity feed
│   │   ├── dashboard/            # Dashboard stats
│   │   ├── institutes/           # Institute management
│   │   ├── razorpay/webhook/     # Razorpay payment webhook
│   │   └── whatsapp/             # send, webhook, mock
│   ├── login/                    # Login page
│   ├── signup/                   # Sign-up page
│   ├── onboarding/               # Institute onboarding
│   ├── teacher-onboarding/       # Teacher onboarding
│   └── auth/callback/            # OAuth callback
├── components/
│   ├── ui/                       # Shared UI primitives (button, card, dialog, etc.)
│   ├── landing/                  # Landing page sections (hero, pricing, features, etc.)
│   ├── dashboard-nav.tsx         # Dashboard navigation
│   └── theme-provider.tsx        # Dark/light mode provider
├── lib/
│   ├── supabase/                 # Client factories (client, server, admin)
│   ├── auth-context.ts           # getMemberContext() — authorization gate
│   ├── ledger.ts                 # Fee ledger helpers
│   ├── activity.ts               # Activity logging
│   ├── dashboard.ts              # Dashboard stats aggregation
│   ├── rate-limit.ts             # IP-based + plan-based rate limiting
│   ├── razorpay.ts               # Razorpay integration
│   ├── whatsapp.ts               # WhatsApp message sending
│   ├── whatsapp-templates.ts     # WhatsApp message templates
│   ├── db-types.ts               # TypeScript DB types
│   └── utils.ts                  # Utility functions
├── data/
│   ├── siteContent.ts            # Site copy
│   └── landingContent.ts         # Landing page content
└── middleware.ts                  # Auth refresh, CORS, rate limiting

supabase/
├── schema.sql                    # Complete database schema with RLS
└── migrations/
    ├── 001_fee_ledger_and_activity.sql
    ├── 002_plan_and_institute_members.sql
    ├── 003_attendance.sql
    ├── 004_batches.sql
    ├── 005_student_teachers.sql
    └── 006_whatsapp_wamid.sql
```

## Architecture

### Authentication & Multi-tenancy

- Supabase handles auth (email/password + Google OAuth). Sessions stored in cookies via `@supabase/ssr`.
- `src/middleware.ts` runs on every request: refreshes session, enforces auth redirects, applies CORS headers, and runs IP/plan-based rate limiting.
- `getMemberContext()` in every protected API route returns the current user's `institute_id`, `role`, and `plan`.
- Row-Level Security (RLS) enforces institute-level data isolation at the database layer.

### Supabase Clients

| Client | File | Use Case |
|--------|------|----------|
| Browser | `src/lib/supabase/client.ts` | Client components |
| Server | `src/lib/supabase/server.ts` | Server components & API routes |
| Admin | `src/lib/supabase/admin.ts` | Webhooks (bypasses RLS) |

### Fee Collection Flow

1. Monthly `fee_ledger` entries auto-created via `ensureLedgerEntriesForCurrentMonth()`
2. Owner sends reminders — API creates Razorpay payment links + sends WhatsApp messages
3. Razorpay webhook confirms payment — updates ledger, handles partial/advance payments
4. Manual marking available for cash/UPI via `/api/payments/manual`
5. Owner receives WhatsApp summary after reminders are sent
6. All actions logged to `activity_logs`

### Role-Based Access

- **Owner**: Full access — admin panel, all students, payments, reminders, broadcast, teacher management
- **Teacher**: Restricted to assigned students (via `student_teachers` mapping), limited API access

### Rate Limiting

Multi-tier system in `src/middleware.ts` + `src/lib/rate-limit.ts`:
- IP-based limits on public/auth routes
- Plan-based per-user limits (Pro: 100/min, Enterprise: 500/min)
- Tighter buckets for sensitive operations (WhatsApp, webhooks)

### Database Schema

Key tables: `institutes`, `institute_members`, `students`, `student_teachers`, `fee_ledger`, `payments`, `activity_logs`, `batches`, `student_batch`, `attendance`. All scoped by `institute_id` with RLS policies.

## CSV Format

For bulk student import:

```csv
student_name,parent_name,parent_phone,monthly_fee,fee_due_day
Rahul,Parent Name,9876543210,2000,5
```

A downloadable template is available from the Students page.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Email/password login |
| `/signup` | New account registration |
| `/onboarding` | First-time institute setup |
| `/teacher-onboarding` | Teacher onboarding flow |
| `/dashboard` | Stats, reminders, activity feed |
| `/students` | Student list, add, CSV upload, mark paid |
| `/payments` | Payment history |
| `/attendance` | Attendance tracking |
| `/broadcast` | Broadcast messages to parents |
| `/admin/teachers` | Manage teachers (owner only) |
| `/teacher` | Teacher dashboard |

## Database Migrations

Run in order in the Supabase SQL Editor:

1. `supabase/schema.sql` — Base schema
2. `supabase/migrations/001_fee_ledger_and_activity.sql` — Fee ledger + activity logs
3. `supabase/migrations/002_plan_and_institute_members.sql` — Plans + member roles
4. `supabase/migrations/003_attendance.sql` — Attendance tracking
5. `supabase/migrations/004_batches.sql` — Batch management
6. `supabase/migrations/005_student_teachers.sql` — Student-teacher mappings
7. `supabase/migrations/006_whatsapp_wamid.sql` — WhatsApp message tracking

## License

Private — All rights reserved.
