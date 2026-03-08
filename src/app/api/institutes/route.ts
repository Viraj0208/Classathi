import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, ownerName, phone, city } = body;

  if (ownerName !== undefined && (typeof ownerName !== "string" || ownerName.trim() === "")) {
    return NextResponse.json(
      { error: "ownerName must be a non-empty string if provided" },
      { status: 400 }
    );
  }

  if (!name || !phone || !city) {
    return NextResponse.json(
      { error: "name, phone, and city are required" },
      { status: 400 }
    );
  }

  const ownerDisplayName = ownerName?.trim() || name;

  const { data: institute, error } = await supabase
    .from("institutes")
    .insert({
      name,
      owner_user_id: user.id,
      phone,
      city,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Institute already exists for this account" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: memberError } = await supabase.from("institute_members").insert({
    institute_id: institute.id,
    user_id: user.id,
    role: "owner",
    name: ownerDisplayName,
    subject: null,
  });

  if (memberError) {
    await supabase.from("institutes").delete().eq("id", institute.id);
    return NextResponse.json(
      { error: memberError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(institute);
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("institute_members")
    .select("institute_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ institute: null });
  }

  const { data, error } = await supabase
    .from("institutes")
    .select("*")
    .eq("id", member.institute_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ institute: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ institute: data });
}
