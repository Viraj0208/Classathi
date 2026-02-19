# Classathi

WhatsApp automation + fee collection platform for tuition centres in India.

## Quick start

```bash
cd InstituteOS
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase and Razorpay credentials
npm run dev
```

## Setup

### 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Authentication → Providers → Email: enable "Confirm email" OFF for magic links
4. Authentication → URL Configuration → Redirect URLs: add `http://localhost:3000/auth/callback`

### 2. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For Razorpay webhook (bypasses RLS) |
| `RAZORPAY_KEY_ID` | For payments | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | For webhook | From Razorpay webhook config |
| `NEXT_PUBLIC_APP_URL` | Yes | e.g. `http://localhost:3000` or your domain |

### 3. Razorpay webhook

1. Razorpay Dashboard → Webhooks → Add webhook
2. URL: `{NEXT_PUBLIC_APP_URL}/api/razorpay/webhook`
3. Events: `payment_link.paid`
4. Copy signing secret to `RAZORPAY_WEBHOOK_SECRET`

### 4. WhatsApp (production)

Replace `/api/whatsapp/mock` calls with your WhatsApp Business API provider's POST endpoint. The payload format is:

```json
{
  "institute_name": "...",
  "student_name": "...",
  "parent_phone": "...",
  "due_amount": 0,
  "payment_link": "https://..."
}
```

## Pages

- `/login` — Magic link (email OTP) login
- `/onboarding` — First-time institute setup
- `/dashboard` — Stats, Send reminders, Broadcast
- `/students` — List, Add, CSV upload
- `/payments` — Payment history

## CSV format

```csv
student_name,parent_name,parent_phone,monthly_fee,fee_due_day
Rahul,Parent Name,9876543210,2000,5
```
