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

  // Fetch the paper to get file path and verify ownership
  const { data: paper, error: fetchError } = await supabase
    .from("past_papers")
    .select("id, file_url, uploaded_by")
    .eq("id", id)
    .eq("institute_id", ctx.instituteId)
    .single();

  if (fetchError || !paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  // Only the uploader or an owner can delete
  if (ctx.role !== "owner" && paper.uploaded_by !== ctx.memberId) {
    return NextResponse.json(
      { error: "You can only delete papers you uploaded" },
      { status: 403 }
    );
  }

  // Delete from storage
  try {
    const url = new URL(paper.file_url);
    const pathParts = url.pathname.split("/past-papers/");
    if (pathParts[1]) {
      await supabase.storage
        .from("past-papers")
        .remove([decodeURIComponent(pathParts[1])]);
    }
  } catch {
    // Storage deletion failure is non-critical
  }

  const { error } = await supabase
    .from("past_papers")
    .delete()
    .eq("id", id)
    .eq("institute_id", ctx.instituteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
