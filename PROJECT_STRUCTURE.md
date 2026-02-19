# Classathi - Project Structure

## Folder Structure

```
Classathi/
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Authenticated routes
│   │   │   ├── layout.tsx         # Dashboard layout with nav
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx       # Main dashboard
│   │   │   │   ├── send-reminders-button.tsx
│   │   │   │   └── broadcast-buttons.tsx
│   │   │   ├── students/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── add-student-modal.tsx
│   │   │   │   └── csv-upload.tsx
│   │   │   └── payments/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── institutes/route.ts
│   │   │   ├── students/
│   │   │   │   ├── route.ts
│   │   │   │   ├── csv/route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── dashboard/route.ts
│   │   │   ├── payments/route.ts
│   │   │   ├── reminders/send/route.ts
│   │   │   ├── broadcast/route.ts
│   │   │   ├── whatsapp/
│   │   │   │   ├── send/route.ts
│   │   │   │   └── mock/route.ts
│   │   │   └── razorpay/webhook/route.ts
│   │   ├── auth/callback/route.ts
│   │   ├── login/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── table.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── dashboard.ts
│   │   ├── razorpay.ts
│   │   ├── utils.ts
│   │   └── db-types.ts
│   └── middleware.ts
├── supabase/
│   └── schema.sql
├── .env.example
├── package.json
└── next.config.js
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (for webhooks, server-only) |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. https://yourapp.com) |

## Supabase Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Enable Email OTP in Authentication > Providers > Email
4. Add redirect URL: `{NEXT_PUBLIC_APP_URL}/auth/callback`

## Razorpay Webhook

1. In Razorpay Dashboard, create webhook for `payment_link.paid`
2. URL: `{NEXT_PUBLIC_APP_URL}/api/razorpay/webhook`
3. Copy the signing secret to `RAZORPAY_WEBHOOK_SECRET`
