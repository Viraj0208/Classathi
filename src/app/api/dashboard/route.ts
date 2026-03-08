import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export async function GET() {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instituteId = ctx.instituteId;

  let studentsQuery = supabase
    .from("students")
    .select("id, monthly_fee")
    .eq("institute_id", instituteId);
  if (ctx.role === "teacher") {
    studentsQuery = studentsQuery.eq("teacher_id", ctx.memberId);
  }
  const { data: students, error: studentsError } = await studentsQuery;

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  const totalStudents = students?.length ?? 0;

  const { month, year } = getCurrentMonthYear();
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

  let paymentsQuery = supabase
    .from("payments")
    .select("student_id, amount")
    .eq("institute_id", instituteId)
    .eq("status", "paid")
    .gte("paid_at", startOfMonth)
    .lte("paid_at", endOfMonth);
  if (ctx.role === "teacher") {
    paymentsQuery = paymentsQuery.eq("teacher_id", ctx.memberId);
  }
  const { data: paidPayments } = await paymentsQuery;

  const paidStudentIds = new Set(
    paidPayments?.map((p) => p.student_id) ?? []
  );
  const paidThisMonth = paidStudentIds.size;

  const unpaidThisMonth = totalStudents - paidThisMonth;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  let ledgerQuery = supabase
    .from("fee_ledger")
    .select("student_id, amount_due, amount_paid, status")
    .eq("institute_id", instituteId)
    .eq("month", monthStart);

  if (ctx.role === "teacher") {
    const teacherStudentIds = students?.map((s) => s.id) ?? [];
    if (teacherStudentIds.length > 0) {
      ledgerQuery = ledgerQuery.in("student_id", teacherStudentIds);
    } else {
      return NextResponse.json({
        totalStudents: 0,
        paidThisMonth: 0,
        unpaidThisMonth: 0,
        outstandingAmount: 0,
      });
    }
  }

  const { data: ledgerEntries } = await ledgerQuery;

  let outstandingAmount = 0;
  for (const entry of ledgerEntries ?? []) {
    const due = Number(entry.amount_due ?? 0);
    const paid = Number(entry.amount_paid ?? 0);
    outstandingAmount += Math.max(0, due - paid);
  }

  return NextResponse.json({
    totalStudents,
    paidThisMonth,
    unpaidThisMonth,
    outstandingAmount,
  });
}
