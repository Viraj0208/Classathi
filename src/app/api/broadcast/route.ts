import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { getMemberContext } from "@/lib/auth-context";
import { sendTemplate, formatPhoneForWhatsApp } from "@/lib/whatsapp";

const VALID_TYPES = ["homework", "absent", "test", "timing_change"] as const;
type BroadcastType = (typeof VALID_TYPES)[number];

const TYPE_TO_TEMPLATE: Record<BroadcastType, string> = {
  homework: "homework_message",
  test: "test_notification",
  absent: "absent_notification",
  timing_change: "timing_change_notification",
};

const TYPE_TO_LABEL: Record<BroadcastType, string> = {
  homework: "Homework reminder",
  absent: "Absence alert",
  test: "Test announcement",
  timing_change: "Class timing update",
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
  const { type, student_ids, subject, message, date, delivery_mode } = body as {
    type: string;
    student_ids: string[];
    subject?: string;
    message?: string;
    date?: string;
    delivery_mode?: "individual" | "group";
  };

  const isGroup = delivery_mode === "group";

  if (!type || !VALID_TYPES.includes(type as BroadcastType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const broadcastType = type as BroadcastType;

  const ids = Array.isArray(student_ids) ? student_ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No students selected" }, { status: 400 });
  }

  let studentsQuery = supabase
    .from("students")
    .select("id, student_name, parent_name, parent_phone")
    .eq("institute_id", institute.id)
    .eq("whatsapp_opt_out", false)
    .in("id", ids);
  if (ctx.role === "teacher") {
    studentsQuery = studentsQuery.eq("teacher_id", ctx.memberId);
  }
  const { data: students } = await studentsQuery;

  const templateName = TYPE_TO_TEMPLATE[broadcastType];
  const today = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  let sent = 0;

  for (const s of students ?? []) {
    const phone = formatPhoneForWhatsApp(s.parent_phone ?? "");
    const parentName = isGroup ? "Dear Parents" : (s.parent_name ?? "Parent");

    let params: string[];
    if (broadcastType === "homework") {
      // homework_message: parent_name, subject, date, homework_text
      params = [
        parentName,
        subject ?? institute.name,
        today,
        message ?? "Please check with your child.",
      ];
    } else if (broadcastType === "test") {
      // test_notification: parent_name, subject, date, test_details
      params = [
        parentName,
        subject ?? institute.name,
        today,
        message ?? "Please ensure your child is prepared.",
      ];
    } else if (broadcastType === "timing_change") {
      // timing_change_notification: parent_name, institute_name, date, details
      params = [
        parentName,
        institute.name,
        today,
        message ?? "Please check with your institute for details.",
      ];
    } else {
      // absent_notification: parent_name, student_name, batch_name, date
      params = isGroup
        ? [parentName, "your child", institute.name, today]
        : [parentName, s.student_name, institute.name, today];
    }

    const waResult = await sendTemplate(phone, templateName, params);

    await supabase.from("whatsapp_logs").insert({
      institute_id: institute.id,
      teacher_id: ctx.memberId,
      student_id: s.id,
      message_type: broadcastType,
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
      message: `${TYPE_TO_LABEL[broadcastType]} sent to ${sent} student${sent === 1 ? "" : "s"}`,
    });
  }

  return NextResponse.json({ sent, total: ids.length });
}
