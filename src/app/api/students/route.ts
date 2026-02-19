import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("institute_id", institute.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
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
      institute_id: institute.id,
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

  return NextResponse.json(data);
}
