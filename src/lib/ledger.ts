import { SupabaseClient } from "@supabase/supabase-js";

export type LedgerStatus = "unpaid" | "partial" | "paid";

export function computeLedgerStatus(
  amountDue: number,
  amountPaid: number
): LedgerStatus {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= amountDue) return "paid";
  return "partial";
}

export async function ensureLedgerEntriesForCurrentMonth(
  supabase: SupabaseClient,
  instituteId: string
): Promise<void> {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data: students } = await supabase
    .from("students")
    .select("id, monthly_fee")
    .eq("institute_id", instituteId);

  if (!students?.length) return;

  const { data: existing } = await supabase
    .from("fee_ledger")
    .select("student_id")
    .eq("institute_id", instituteId)
    .eq("month", month);

  const existingStudentIds = new Set(existing?.map((e) => e.student_id) ?? []);
  const toInsert = students.filter((s) => !existingStudentIds.has(s.id));

  if (toInsert.length === 0) return;

  const rows = toInsert.map((s) => ({
    institute_id: instituteId,
    student_id: s.id,
    month,
    amount_due: Number(s.monthly_fee) || 0,
    amount_paid: 0,
    status: "unpaid" as LedgerStatus,
  }));

  await supabase.from("fee_ledger").insert(rows);
}

export async function getCurrentMonthLedger(
  supabase: SupabaseClient,
  instituteId: string,
  studentId: string
) {
  const month = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);

  const { data } = await supabase
    .from("fee_ledger")
    .select("*")
    .eq("institute_id", instituteId)
    .eq("student_id", studentId)
    .eq("month", month)
    .single();

  return data;
}

export async function getOrCreateCurrentMonthLedger(
  supabase: SupabaseClient,
  instituteId: string,
  studentId: string,
  monthlyFee: number
) {
  await ensureLedgerEntriesForCurrentMonth(supabase, instituteId);

  let ledger = await getCurrentMonthLedger(supabase, instituteId, studentId);
  if (!ledger) {
    const month = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .slice(0, 10);
    const { data } = await supabase
      .from("fee_ledger")
      .insert({
        institute_id: instituteId,
        student_id: studentId,
        month,
        amount_due: monthlyFee,
        amount_paid: 0,
        status: "unpaid",
      })
      .select()
      .single();
    ledger = data;
  }
  return ledger;
}
