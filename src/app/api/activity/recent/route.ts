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
    .from("activity_logs")
    .select("id, type, message, created_at, student_id")
    .eq("institute_id", institute.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
