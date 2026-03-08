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
    .from("batches")
    .select("*")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: true });

  if (ctx.role === "teacher") {
    query = query.eq("teacher_id", ctx.memberId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  const { name, type, session_fee } = body;

  if (!name || !type || !["group", "one_to_one"].includes(type)) {
    return NextResponse.json(
      { error: "name and type ('group' or 'one_to_one') are required" },
      { status: 400 }
    );
  }

  if (type === "one_to_one" && (!session_fee || Number(session_fee) <= 0)) {
    return NextResponse.json(
      { error: "session_fee is required for one_to_one batches" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("batches")
    .insert({
      institute_id: ctx.instituteId,
      teacher_id: ctx.memberId,
      name: name.trim(),
      type,
      session_fee: type === "one_to_one" ? Number(session_fee) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
