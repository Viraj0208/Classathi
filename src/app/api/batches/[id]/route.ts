import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

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

  const { data: batch } = await supabase
    .from("batches")
    .select("id, teacher_id")
    .eq("id", id)
    .eq("institute_id", ctx.instituteId)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  if (ctx.role === "teacher" && batch.teacher_id !== ctx.memberId) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
