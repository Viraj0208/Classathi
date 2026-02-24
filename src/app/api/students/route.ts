import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

export async function GET() {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("students")
    .select("*")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: false });
  if (ctx.role === "teacher") {
    query = query.eq("teacher_id", ctx.memberId);
  }
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    student_name,
    parent_name,
    parent_phone,
    monthly_fee = 0,
    fee_due_day = 1,
  } = body;

  if (!student_name || !parent_name || !parent_phone) {
    return NextResponse.json(
      { error: "student_name, parent_name, and parent_phone are required" },
      { status: 400 }
    );
  }

  const dueDay = Math.min(31, Math.max(1, Number(fee_due_day) || 1));

  const { data, error } = await supabase
    .from("students")
    .insert({
      institute_id: ctx.instituteId,
      teacher_id: ctx.memberId,
      student_name,
      parent_name,
      parent_phone: String(parent_phone).replace(/\D/g, "").slice(-10),
      monthly_fee: Number(monthly_fee) || 0,
      fee_due_day: dueDay,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-create student_teachers row for the creating teacher
  await supabase.from("student_teachers").insert({
    student_id: data.id,
    teacher_id: ctx.memberId,
    institute_id: ctx.instituteId,
    monthly_fee: Number(monthly_fee) || 0,
    fee_due_day: dueDay,
  });

  return NextResponse.json(data);
}
