import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  let ctx;
  try { ctx = await getMemberContext(supabase); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { data, error } = await supabase
    .from("student_batches")
    .select("student_id, students(id, student_name, parent_name, parent_phone)")
    .eq("batch_id", id)
    .eq("institute_id", ctx.instituteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  let ctx;
  try { ctx = await getMemberContext(supabase); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { student_id } = await request.json();
  if (!student_id) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("student_batches")
    .insert({ student_id, batch_id: id, institute_id: ctx.instituteId });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Student already in this batch" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  let ctx;
  try { ctx = await getMemberContext(supabase); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { student_id } = await request.json();
  if (!student_id) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("student_batches")
    .delete()
    .eq("batch_id", id)
    .eq("student_id", student_id)
    .eq("institute_id", ctx.instituteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
