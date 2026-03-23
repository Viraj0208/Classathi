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
  instituteId: string,
  studentIds?: string[],
  teacherId?: string
): Promise<void> {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // Query student_teachers to get per-teacher fees
  let stQuery = supabase
    .from("student_teachers")
    .select("student_id, monthly_fee, teacher_id")
    .eq("institute_id", instituteId);

  if (teacherId) {
    stQuery = stQuery.eq("teacher_id", teacherId);
  }

  if (studentIds && studentIds.length > 0) {
    stQuery = stQuery.in("student_id", studentIds);
  }

  const { data: studentTeachers } = await stQuery;

  // Map to the shape the rest of the function expects
  const students = (studentTeachers ?? []).map((st) => ({
    id: st.student_id,
    monthly_fee: st.monthly_fee,
    teacher_id: st.teacher_id,
  }));

  if (!students.length) return;

  // Query existing ledger entries, scoped by teacher if provided
  let existingQuery = supabase
    .from("fee_ledger")
    .select("student_id, teacher_id")
    .eq("institute_id", instituteId)
    .eq("month", month);

  if (teacherId) {
    existingQuery = existingQuery.eq("teacher_id", teacherId);
  }

  const { data: existing } = await existingQuery;

  // Build a set of "studentId|teacherId" keys for dedup
  const existingKeys = new Set(
    (existing ?? []).map((e) => `${e.student_id}|${e.teacher_id ?? ""}`)
  );

  const toInsert = students.filter(
    (s) => !existingKeys.has(`${s.id}|${s.teacher_id ?? ""}`)
  );

  if (toInsert.length === 0) return;

  const rows = toInsert.map((s) => ({
    institute_id: instituteId,
    student_id: s.id,
    teacher_id: s.teacher_id ?? null,
    month,
    amount_due: Number(s.monthly_fee) || 0,
    amount_paid: 0,
    status: "unpaid" as LedgerStatus,
  }));

  // Use upsert with ignoreDuplicates to prevent race conditions
  // if two requests try to create ledger entries simultaneously
  await supabase.from("fee_ledger").upsert(rows, {
    onConflict: "institute_id,student_id,teacher_id,month",
    ignoreDuplicates: true,
  });
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
  await ensureLedgerEntriesForCurrentMonth(supabase, instituteId, [studentId]);

  let ledger = await getCurrentMonthLedger(supabase, instituteId, studentId);
  if (!ledger) {
    const month = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .slice(0, 10);
    // Use upsert to handle race conditions where another request
    // may have created the entry between our SELECT and INSERT
    const { data } = await supabase
      .from("fee_ledger")
      .upsert(
        {
          institute_id: instituteId,
          student_id: studentId,
          month,
          amount_due: monthlyFee,
          amount_paid: 0,
          status: "unpaid",
        },
        {
          onConflict: "institute_id,student_id,teacher_id,month",
          ignoreDuplicates: true,
        }
      )
      .select()
      .single();
    // If upsert returned nothing (duplicate ignored), re-fetch
    ledger = data ?? await getCurrentMonthLedger(supabase, instituteId, studentId);
  }
  return ledger;
}
