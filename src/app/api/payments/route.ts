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
    .from("payments")
    .select(`
      *,
      students (
        student_name,
        parent_name,
        parent_phone
      )
    `)
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
