# Classathi Production Upgrade Summary

## PART 1 — Fee Ledger System

### SQL Migration
**File:** `supabase/migrations/001_fee_ledger_and_activity.sql`

- Creates `fee_ledger` table: id, institute_id, student_id, month, amount_due, amount_paid, status (unpaid|partial|paid)
- Adds `ledger_id` and `source` (razorpay|manual) to `payments` table
- RLS policies for fee_ledger

### Logic
- **`src/lib/ledger.ts`** — Helpers: `ensureLedgerEntriesForCurrentMonth`, `getOrCreateCurrentMonthLedger`, `computeLedgerStatus`
- **`src/lib/dashboard.ts`** — On load: ensures ledger entries, then reads stats from fee_ledger (paid count, unpaid count, outstanding sum)
- Status: `amount_paid == 0` → unpaid; `0 < amount_paid < amount_due` → partial; `amount_paid >= amount_due` → paid

---

## PART 2 — Razorpay Webhook

**File:** `src/app/api/razorpay/webhook/route.ts`

- Verifies signature (unchanged)
- Locates payment by payment_link_id
- Locates/creates ledger for current month
- Increments amount_paid; supports multiple payments, partial payments
- Advance payments: excess carried to next month ledger
- Updates payment status, paid_at, ledger_id
- Logs activity ("₹X received from Student")

---

## PART 3 — Manual Payment Marking

### API
**File:** `src/app/api/payments/manual/route.ts`

- `POST /api/payments/manual`
- Payload: `{ student_id, amount, payment_method: "cash" | "upi" }`
- Updates ledger amount_paid and status
- Inserts payment (payment_link_id=null, source=manual)
- Logs activity

### UI
**Files:** `src/app/(dashboard)/students/mark-paid-button.tsx`, `src/app/(dashboard)/students/page.tsx`

- "Mark Paid" button per student row
- Modal: amount (prefilled with monthly_fee), payment method (Cash/UPI)
- On success: router.refresh()

---

## PART 4 — Activity Feed

### Table
**In migration:** `activity_logs` — id, institute_id, type, student_id, message, created_at  
Types: reminder_sent, payment_received, manual_payment, broadcast_sent

### Logging
- Reminders: `logActivity` per reminder sent
- Razorpay webhook: payment_received
- Manual payment API: manual_payment
- Broadcast API: broadcast_sent (one summary per broadcast)

### API
**File:** `src/app/api/activity/recent/route.ts` — `GET /api/activity/recent` returns last 20 events

### UI
**File:** `src/app/(dashboard)/dashboard/recent-activity.tsx`

- "Recent Activity" card on dashboard
- Scrollable list, mobile-friendly
- Shows message + relative time

---

## PART 5 — CSV Template Download

**File:** `src/app/api/students/template/route.ts` — `GET /api/students/template`

- Returns CSV with headers: student_name, parent_name, parent_phone, monthly_fee, fee_due_day
- Content-Disposition: attachment

**UI:** "Download Excel Template" button on students page

---

## PART 6 — Owner Summary After Reminders

**File:** `src/app/api/reminders/send/route.ts`

- Uses fee_ledger for unpaid list (status != 'paid')
- Outstanding = amount_due - amount_paid per ledger
- Payment links linked to ledger_id
- After completion: sends WhatsApp to institute.phone with:
  - "Fee reminders sent to X parents. Expected collection: ₹Y. You will be notified automatically when parents pay."

---

## PART 7 — Security (RLS)

**In migration:**
- `fee_ledger`: policy by institute_id (owner_user_id)
- `activity_logs`: policy by institute_id
- `payments`: existing policy already restricts by institute_id; no cross-institute access

---

## File Placement Reference

| What | Path |
|------|------|
| SQL migration | `supabase/migrations/001_fee_ledger_and_activity.sql` |
| Ledger helpers | `src/lib/ledger.ts` |
| Activity helpers | `src/lib/activity.ts` |
| Dashboard stats | `src/lib/dashboard.ts` |
| Razorpay webhook | `src/app/api/razorpay/webhook/route.ts` |
| Manual payment API | `src/app/api/payments/manual/route.ts` |
| Activity API | `src/app/api/activity/recent/route.ts` |
| Students template API | `src/app/api/students/template/route.ts` |
| Reminders API | `src/app/api/reminders/send/route.ts` |
| Broadcast API | `src/app/api/broadcast/route.ts` |
| Mark Paid UI | `src/app/(dashboard)/students/mark-paid-button.tsx` |
| Recent Activity UI | `src/app/(dashboard)/dashboard/recent-activity.tsx` |
| Students page | `src/app/(dashboard)/students/page.tsx` |
| Dashboard page | `src/app/(dashboard)/dashboard/page.tsx` |

---

## Migration Steps

1. Run `supabase/migrations/001_fee_ledger_and_activity.sql` in Supabase SQL Editor
2. Deploy/restart the app
3. Dashboard load will auto-create ledger entries for current month for all students
