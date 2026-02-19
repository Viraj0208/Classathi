import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getOrCreateCurrentMonthLedger,
  computeLedgerStatus,
} from "@/lib/ledger";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: institute } = await supabase
    .from("institutes")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!institute) {
    return NextResponse.json({ error: "Institute not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    student_id,
    amount,
    payment_method,
  } = body as {
    student_id: string;
    amount: number;
    payment_method: "cash" | "upi";
  };

  if (!student_id || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "student_id and positive amount are required" },
      { status: 400 }
    );
  }

  if (!payment_method || !["cash", "upi"].includes(payment_method)) {
    return NextResponse.json(
      { error: "payment_method must be 'cash' or 'upi'" },
      { status: 400 }
    );
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, student_name, monthly_fee, institute_id")
    .eq("id", student_id)
    .eq("institute_id", institute.id)
    .single();

  if (!student || student.institute_id !== institute.id) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const ledger = await getOrCreateCurrentMonthLedger(
    supabase,
    institute.id,
    student_id,
    Number(student.monthly_fee) || 0
  );

  if (!ledger) {
    return NextResponse.json(
      { error: "Could not create or fetch ledger" },
      { status: 500 }
    );
  }

  const amountDue = Number(ledger.amount_due ?? 0);
  const currentPaid = Number(ledger.amount_paid ?? 0);
  const newPaid = currentPaid + amount;
  const newStatus = computeLedgerStatus(amountDue, newPaid);

  await supabase
    .from("fee_ledger")
    .update({ amount_paid: newPaid, status: newStatus })
    .eq("id", ledger.id);

  const { data: paymentRecord, error: payError } = await supabase
    .from("payments")
    .insert({
      institute_id: institute.id,
      student_id: student_id,
      amount,
      payment_link_id: null,
      status: "paid",
      paid_at: new Date().toISOString(),
      ledger_id: ledger.id,
      source: "manual",
    })
    .select()
    .single();

  if (payError) {
    return NextResponse.json(
      { error: payError.message },
      { status: 500 }
    );
  }

  await logActivity(supabase, {
    instituteId: institute.id,
    type: "manual_payment",
    studentId: student_id,
    message: `₹${Math.round(amount)} received from ${student.student_name} (${payment_method})`,
  });

  return NextResponse.json(paymentRecord);
}
