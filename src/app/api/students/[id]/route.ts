import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth-context";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("students")
    .select("id, teacher_id")
    .eq("id", id)
    .eq("institute_id", ctx.instituteId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (ctx.role === "teacher" && existing.teacher_id !== ctx.memberId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await request.json();
  const { student_name, parent_name, parent_phone, monthly_fee, fee_due_day } = body;

  const updates: Record<string, unknown> = {};
  if (student_name !== undefined) updates.student_name = student_name;
  if (parent_name !== undefined) updates.parent_name = parent_name;
  if (parent_phone !== undefined) updates.parent_phone = String(parent_phone).replace(/\D/g, "").slice(-10);
  if (monthly_fee !== undefined) updates.monthly_fee = Number(monthly_fee);
  if (fee_due_day !== undefined) updates.fee_due_day = Math.min(31, Math.max(1, Number(fee_due_day) || 1));

  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("students")
    .select("id, teacher_id")
    .eq("id", id)
    .eq("institute_id", ctx.instituteId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (ctx.role === "teacher" && existing.teacher_id !== ctx.memberId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
