import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { computeLedgerStatus } from "@/lib/ledger";
import { logActivity } from "@/lib/activity";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  type WebhookPayload = {
    event: string;
    payload?: {
      payment_link?: { entity?: { id: string } };
      payment?: { entity?: { id: string; amount: number; status: string } };
    };
  };

  let event: WebhookPayload;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment_link.paid") {
    const paymentLinkId = event.payload?.payment_link?.entity?.id;
    const payment = event.payload?.payment?.entity;
    if (!paymentLinkId || !payment) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    const { data: paymentRecord } = await supabase
      .from("payments")
      .select("id, student_id, institute_id, ledger_id, amount")
      .eq("payment_link_id", paymentLinkId)
      .eq("status", "pending")
      .single();

    if (!paymentRecord) {
      return NextResponse.json({ received: true });
    }

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

    let remainingToAllocate = amountPaid;
    const now = new Date();
    let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let firstLedgerId: string | null = ledgerId;

    while (remainingToAllocate > 0) {
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
          .update({
            amount_paid: newPaid,
            status: newStatus,
          })
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

    await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        ledger_id: firstLedgerId ?? ledgerId,
      })
      .eq("id", paymentRecord.id);

    await logActivity(supabase, {
      instituteId: paymentRecord.institute_id,
      type: "payment_received",
      studentId: paymentRecord.student_id,
      message: `₹${Math.round(amountPaid)} received from ${student?.student_name ?? "student"}`,
    });
  }

  return NextResponse.json({ received: true });
}
