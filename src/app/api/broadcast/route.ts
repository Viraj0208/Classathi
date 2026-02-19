import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const TEMPLATES: Record<string, (institute: string, student: string) => string> = {
  homework: (inst, student) =>
    `[${inst}] Homework reminder for ${student}: Please complete today's homework and bring it tomorrow.`,
  absent: (inst, student) =>
    `[${inst}] Absence alert: ${student} was absent today. Please ensure they catch up on the missed lessons.`,
  test: (inst, student) =>
    `[${inst}] Test announcement for ${student}: A test has been scheduled. Please ensure your child is prepared.`,
};

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
    .select("id, name")
    .eq("owner_user_id", user.id)
    .single();

  if (!institute) {
    return NextResponse.json({ error: "Institute not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, student_ids } = body as { type: "homework" | "absent" | "test"; student_ids: string[] };

  if (!type || !["homework", "absent", "test"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ids = Array.isArray(student_ids) ? student_ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No students selected" }, { status: 400 });
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, student_name, parent_phone")
    .eq("institute_id", institute.id)
    .in("id", ids);

  const template = TEMPLATES[type];
  let sent = 0;
  const typeLabel = type === "homework" ? "Homework" : type === "absent" ? "Absence alert" : "Test announcement";

  for (const s of students ?? []) {
    const message = template(institute.name, s.student_name);
    await fetch(`${APP_URL}/api/whatsapp/mock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institute_name: institute.name,
        student_name: s.student_name,
        parent_phone: s.parent_phone,
        message,
        message_type: type,
      }),
    });
    await supabase.from("whatsapp_logs").insert({
      institute_id: institute.id,
      student_id: s.id,
      message_type: type,
      status: "sent",
    });
    sent++;
  }

  if (sent > 0) {
    await logActivity(supabase, {
      instituteId: institute.id,
      type: "broadcast_sent",
      studentId: null,
      message: `${typeLabel} sent to ${sent} student${sent === 1 ? "" : "s"}`,
    });
  }

  return NextResponse.json({ sent, total: ids.length });
}
