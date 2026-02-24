import { createClient } from "@/lib/supabase/server";
import { ensureLedgerEntriesForCurrentMonth } from "./ledger";
import { getMemberContext } from "./auth-context";

export async function getDashboardStats() {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return null;
  }

  const instituteId = ctx.instituteId;

  let studentsQuery = supabase
    .from("students")
    .select("id")
    .eq("institute_id", instituteId);
  if (ctx.role === "teacher") {
    studentsQuery = studentsQuery.eq("teacher_id", ctx.memberId);
  }
  const { data: students } = await studentsQuery;
  const totalStudents = students?.length ?? 0;

  const teacherStudentIds = ctx.role === "teacher"
    ? students?.map((s) => s.id)
    : undefined;

  await ensureLedgerEntriesForCurrentMonth(
    supabase,
    instituteId,
    teacherStudentIds,
    ctx.role === "teacher" ? ctx.memberId : undefined
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data: allLedgerEntries } = await supabase
    .from("fee_ledger")
    .select("id, student_id, amount_due, amount_paid, status")
    .eq("institute_id", instituteId)
    .eq("month", monthStart);

  let ledgerEntries = allLedgerEntries ?? [];
  if (ctx.role === "teacher") {
    const studentIds = new Set(students?.map((s) => s.id) ?? []);
    ledgerEntries = ledgerEntries.filter((e) => studentIds.has(e.student_id));
  }

  let paidThisMonth = 0;
  let unpaidThisMonth = 0;
  let outstandingAmount = 0;

  for (const entry of ledgerEntries ?? []) {
    if (entry.status === "paid") {
      paidThisMonth++;
    } else {
      unpaidThisMonth++;
      const due = Number(entry.amount_due ?? 0);
      const paid = Number(entry.amount_paid ?? 0);
      outstandingAmount += Math.max(0, due - paid);
    }
  }

  return {
    totalStudents,
    paidThisMonth,
    unpaidThisMonth,
    outstandingAmount,
  };
}
