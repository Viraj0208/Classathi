import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

export async function POST(request: Request) {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { student_id, teacher_id, monthly_fee, fee_due_day = 1 } = body;

  if (!student_id || !teacher_id || monthly_fee === undefined) {
    return NextResponse.json(
      { error: "student_id, teacher_id, and monthly_fee are required" },
      { status: 400 }
    );
  }

  // Teachers can only assign themselves
  if (ctx.role === "teacher" && teacher_id !== ctx.memberId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("student_teachers")
    .insert({
      student_id,
      teacher_id,
      institute_id: ctx.instituteId,
      monthly_fee: Number(monthly_fee),
      fee_due_day: Math.min(31, Math.max(1, Number(fee_due_day) || 1)),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Student already assigned to this teacher" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
