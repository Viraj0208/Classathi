import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { computeLedgerStatus } from "@/lib/ledger";
import { logActivity } from "@/lib/activity";
import { NextResponse } from "next/server";

type WebhookPayload = {
  event: string;
  account_id?: string;
  payload?: {
    payment_link?: { entity?: { id: string; status?: string } };
    payment?: {
      entity?: {
        id: string;
        amount: number;
        status: string;
        error_description?: string;
      };
    };
    refund?: { entity?: { id: string; amount: number; payment_id: string } };
  };
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  if (!verifyWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: WebhookPayload;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Idempotency: derive a unique event key from the payload ──────────
  // Razorpay doesn't send a unique event ID, so we derive one from
  // event type + entity ID to prevent double-processing on retries.
  const eventKey = deriveEventKey(event);

  if (eventKey) {
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("razorpay_event_id", eventKey)
      .maybeSingle();

    if (existing) {
      // Already processed this event — return success without re-processing
      return NextResponse.json({ received: true, deduplicated: true });
    }
  }

  // ── Route to handler based on event type ─────────────────────────────
  switch (event.event) {
    case "payment_link.paid":
      await handlePaymentLinkPaid(supabase, event, eventKey);
      break;

    case "payment_link.expired":
      await handlePaymentLinkExpired(supabase, event);
      break;

    case "payment.failed":
      await handlePaymentFailed(supabase, event, eventKey);
      break;

    case "refund.processed":
    case "refund.created":
      await handleRefund(supabase, event);
      break;

    default:
      // Acknowledge unknown events so Razorpay doesn't retry
      break;
  }

  return NextResponse.json({ received: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────

function deriveEventKey(event: WebhookPayload): string | null {
  const paymentId = event.payload?.payment?.entity?.id;
  const refundId = event.payload?.refund?.entity?.id;

  if (event.event === "payment_link.paid" && paymentId) {
    return `paid:${paymentId}`;
  }
  if (event.event === "payment.failed" && paymentId) {
    return `failed:${paymentId}`;
  }
  if (
    (event.event === "refund.processed" || event.event === "refund.created") &&
    refundId
  ) {
    return `refund:${refundId}`;
  }
  return null;
}

// ── payment_link.paid ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentLinkPaid(supabase: any, event: WebhookPayload, eventKey: string | null) {
  const paymentLinkId = event.payload?.payment_link?.entity?.id;
  const payment = event.payload?.payment?.entity;
  if (!paymentLinkId || !payment) return;

  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, student_id, institute_id, ledger_id, amount")
    .eq("payment_link_id", paymentLinkId)
    .eq("status", "pending")
    .single();

  if (!paymentRecord) return;

  const amountPaid = Number(payment.amount) / 100;

  let ledgerId = paymentRecord.ledger_id;
  const { data: student } = await supabase
    .from("students")
    .select("id, student_name, monthly_fee")
    .eq("id", paymentRecord.student_id)
    .single();

  if (!ledgerId) {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const { data: ledger } = await supabase
      .from("fee_ledger")
      .select("id, amount_due, amount_paid")
      .eq("institute_id", paymentRecord.institute_id)
      .eq("student_id", paymentRecord.student_id)
      .eq("month", month)
      .single();

    if (ledger) {
      ledgerId = ledger.id;
    } else {
      const { data: newLedger } = await supabase
        .from("fee_ledger")
        .insert({
          institute_id: paymentRecord.institute_id,
          student_id: paymentRecord.student_id,
          month,
          amount_due: Number(student?.monthly_fee) || 0,
          amount_paid: 0,
          status: "unpaid",
        })
        .select("id")
        .single();
      ledgerId = newLedger?.id ?? null;
    }
  }

  // Allocate payment across current and future months
  let remainingToAllocate = amountPaid;
  const now = new Date();
  let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let firstLedgerId: string | null = ledgerId;

  let iterations = 0;
  const MAX_ITERATIONS = 24;

  while (remainingToAllocate > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const monthStr = currentMonth.toISOString().slice(0, 10);
    const { data: ledger } = await supabase
      .from("fee_ledger")
      .select("id, amount_due, amount_paid")
      .eq("institute_id", paymentRecord.institute_id)
      .eq("student_id", paymentRecord.student_id)
      .eq("month", monthStr)
      .single();

    if (!ledger) {
      const amountDue = Number(student?.monthly_fee) || 0;
      if (amountDue <= 0) break;

      const { data: newLedger } = await supabase
        .from("fee_ledger")
        .insert({
          institute_id: paymentRecord.institute_id,
          student_id: paymentRecord.student_id,
          month: monthStr,
          amount_due: amountDue,
          amount_paid: 0,
          status: "unpaid",
        })
        .select("id, amount_due")
        .single();

      if (!newLedger) break;

      const due = Number(newLedger.amount_due);
      const toApply = Math.min(remainingToAllocate, due);
      if (toApply <= 0) break;

      const newPaid = toApply;
      const newStatus = computeLedgerStatus(due, newPaid);

      if (!firstLedgerId) firstLedgerId = newLedger.id;

      await supabase
        .from("fee_ledger")
        .update({ amount_paid: newPaid, status: newStatus })
        .eq("id", newLedger.id);

      remainingToAllocate -= toApply;
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      continue;
    }

    const due = Number(ledger.amount_due ?? 0);
    const currentPaid = Number(ledger.amount_paid ?? 0);
    const outstanding = Math.max(0, due - currentPaid);
    const toApply = Math.min(remainingToAllocate, outstanding);

    if (toApply <= 0) break;

    const newPaid = currentPaid + toApply;
    const newStatus = computeLedgerStatus(due, newPaid);

    if (!firstLedgerId) firstLedgerId = ledger.id;

    await supabase
      .from("fee_ledger")
      .update({ amount_paid: newPaid, status: newStatus })
      .eq("id", ledger.id);

    remainingToAllocate -= toApply;
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  // Update payment record to captured
  await supabase
    .from("payments")
    .update({
      status: "captured",
      paid_at: new Date().toISOString(),
      ledger_id: firstLedgerId ?? ledgerId,
      razorpay_payment_id: payment.id,
      razorpay_event_id: eventKey,
    })
    .eq("id", paymentRecord.id);

  await logActivity(supabase, {
    instituteId: paymentRecord.institute_id,
    type: "payment_received",
    studentId: paymentRecord.student_id,
    message: `₹${Math.round(amountPaid)} received from ${student?.student_name ?? "student"}`,
  });
}

// ── payment_link.expired ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentLinkExpired(supabase: any, event: WebhookPayload) {
  const paymentLinkId = event.payload?.payment_link?.entity?.id;
  if (!paymentLinkId) return;

  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, institute_id, student_id")
    .eq("payment_link_id", paymentLinkId)
    .eq("status", "pending")
    .single();

  if (!paymentRecord) return;

  await supabase
    .from("payments")
    .update({ status: "expired" })
    .eq("id", paymentRecord.id);

  const { data: student } = await supabase
    .from("students")
    .select("student_name")
    .eq("id", paymentRecord.student_id)
    .single();

  await logActivity(supabase, {
    instituteId: paymentRecord.institute_id,
    type: "payment_expired",
    studentId: paymentRecord.student_id,
    message: `Payment link expired for ${student?.student_name ?? "student"}`,
  });
}

// ── payment.failed ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(supabase: any, event: WebhookPayload, eventKey: string | null) {
  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity) return;

  // Try to find the payment by the Razorpay payment link reference
  const paymentLinkId = event.payload?.payment_link?.entity?.id;
  if (!paymentLinkId) return;

  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, institute_id, student_id")
    .eq("payment_link_id", paymentLinkId)
    .eq("status", "pending")
    .single();

  if (!paymentRecord) return;

  await supabase
    .from("payments")
    .update({
      status: "failed",
      razorpay_payment_id: paymentEntity.id,
      razorpay_event_id: eventKey,
    })
    .eq("id", paymentRecord.id);

  const { data: student } = await supabase
    .from("students")
    .select("student_name")
    .eq("id", paymentRecord.student_id)
    .single();

  await logActivity(supabase, {
    instituteId: paymentRecord.institute_id,
    type: "payment_failed",
    studentId: paymentRecord.student_id,
    message: `Payment failed for ${student?.student_name ?? "student"}: ${paymentEntity.error_description ?? "unknown error"}`,
  });
}

// ── refund.processed / refund.created ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefund(supabase: any, event: WebhookPayload) {
  const refund = event.payload?.refund?.entity;
  if (!refund) return;

  // Find the captured payment by razorpay_payment_id
  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, institute_id, student_id, ledger_id, amount")
    .eq("razorpay_payment_id", refund.payment_id)
    .eq("status", "captured")
    .single();

  if (!paymentRecord) return;

  const refundAmount = Number(refund.amount) / 100;

  // Mark payment as refunded
  await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("id", paymentRecord.id);

  // Reverse the ledger entry if we have a ledger_id
  if (paymentRecord.ledger_id) {
    const { data: ledger } = await supabase
      .from("fee_ledger")
      .select("id, amount_due, amount_paid")
      .eq("id", paymentRecord.ledger_id)
      .single();

    if (ledger) {
      const newPaid = Math.max(0, Number(ledger.amount_paid) - refundAmount);
      const newStatus = computeLedgerStatus(
        Number(ledger.amount_due),
        newPaid
      );
      await supabase
        .from("fee_ledger")
        .update({ amount_paid: newPaid, status: newStatus })
        .eq("id", ledger.id);
    }
  }

  const { data: student } = await supabase
    .from("students")
    .select("student_name")
    .eq("id", paymentRecord.student_id)
    .single();

  await logActivity(supabase, {
    instituteId: paymentRecord.institute_id,
    type: "payment_refunded",
    studentId: paymentRecord.student_id,
    message: `₹${Math.round(refundAmount)} refunded for ${student?.student_name ?? "student"}`,
  });
}
