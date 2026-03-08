import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { getMemberContext } from "@/lib/auth-context";
import { sendTemplate, formatPhoneForWhatsApp } from "@/lib/whatsapp";

const TYPE_TO_TEMPLATE: Record<string, string> = {
  homework: "homework_message",
  test: "test_notification",
  absent: "absent_notification",
};

export async function POST(request: Request) {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: institute } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("id", ctx.instituteId)
    .single();

  if (!institute) {
    return NextResponse.json({ error: "Institute not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, student_ids, subject, message, date } = body as {
    type: "homework" | "absent" | "test";
    student_ids: string[];
    subject?: string;
    message?: string;
    date?: string;
  };

  if (!type || !["homework", "absent", "test"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ids = Array.isArray(student_ids) ? student_ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No students selected" }, { status: 400 });
  }

  let studentsQuery = supabase
    .from("students")
    .select("id, student_name, parent_name, parent_phone")
    .eq("institute_id", institute.id)
    .in("id", ids);
  if (ctx.role === "teacher") {
    studentsQuery = studentsQuery.eq("teacher_id", ctx.memberId);
  }
  const { data: students } = await studentsQuery;

  const templateName = TYPE_TO_TEMPLATE[type] ?? type;
  const today = date ?? new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let sent = 0;
  const typeLabel = type === "homework" ? "Homework" : type === "absent" ? "Absence alert" : "Test announcement";

  for (const s of students ?? []) {
    const phone = formatPhoneForWhatsApp(s.parent_phone ?? "");
    const parentName = s.parent_name ?? "Parent";

    let params: string[];
    if (type === "homework") {
      // homework_message: parent_name, subject, date, homework_text
      params = [parentName, subject ?? institute.name, today, message ?? "Please check with your child."];
    } else if (type === "test") {
      // test_notification: parent_name, subject, date, test_details
      params = [parentName, subject ?? institute.name, today, message ?? "Please ensure your child is prepared."];
    } else {
      // absent_notification: parent_name, student_name, batch_name, date
      params = [parentName, s.student_name, institute.name, today];
    }

    const waResult = await sendTemplate(phone, templateName, params);

    await supabase.from("whatsapp_logs").insert({
      institute_id: institute.id,
      teacher_id: ctx.memberId,
      student_id: s.id,
      message_type: type,
      status: waResult.success ? "sent" : "failed",
      wamid: waResult.messageId ?? null,
      template_name: templateName,
    });

    if (waResult.success) sent++;
  }

  if (sent > 0) {
    await logActivity(supabase, {
      instituteId: ctx.instituteId,
      type: "broadcast_sent",
      studentId: null,
      message: `${typeLabel} sent to ${sent} student${sent === 1 ? "" : "s"}`,
    });
  }

  return NextResponse.json({ sent, total: ids.length });
}
