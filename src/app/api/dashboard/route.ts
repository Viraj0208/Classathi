import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export async function GET() {
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

  const instituteId = institute.id;

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, monthly_fee")
    .eq("institute_id", instituteId);

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  const totalStudents = students?.length ?? 0;

  const { month, year } = getCurrentMonthYear();
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data: paidPayments } = await supabase
    .from("payments")
    .select("student_id, amount")
    .eq("institute_id", instituteId)
    .eq("status", "paid")
    .gte("paid_at", startOfMonth)
    .lte("paid_at", endOfMonth);

  const paidStudentIds = new Set(
    paidPayments?.map((p) => p.student_id) ?? []
  );
  const paidThisMonth = paidStudentIds.size;

  const unpaidThisMonth = totalStudents - paidThisMonth;

  const totalMonthlyFees =
    students?.reduce((sum, s) => sum + Number(s.monthly_fee || 0), 0) ?? 0;
  const paidAmount =
    paidPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0;
  const outstandingAmount = totalMonthlyFees - paidAmount;

  return NextResponse.json({
    totalStudents,
    paidThisMonth,
    unpaidThisMonth,
    outstandingAmount: Math.max(0, outstandingAmount),
  });
}
