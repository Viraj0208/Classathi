import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";
import { sendTemplate, formatPhoneForWhatsApp } from "@/lib/whatsapp";

export async function GET(request: Request) {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const batchId = searchParams.get("batch_id");

  let studentsQuery = supabase
    .from("students")
    .select("id, student_name, parent_name, parent_phone")
    .eq("institute_id", ctx.instituteId)
    .order("student_name", { ascending: true });
  if (ctx.role === "teacher") {
    studentsQuery = studentsQuery.eq("teacher_id", ctx.memberId);
  }

  if (batchId) {
    const { data: batchStudentRows } = await supabase
      .from("student_batches")
      .select("student_id")
      .eq("batch_id", batchId)
      .eq("institute_id", ctx.instituteId);

    const batchStudentIds = batchStudentRows?.map(r => r.student_id) ?? [];
    if (batchStudentIds.length === 0) {
      return NextResponse.json([]);
    }
    studentsQuery = studentsQuery.in("id", batchStudentIds);
  }

  const { data: students } = await studentsQuery;

  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("student_id, status")
    .eq("institute_id", ctx.instituteId)
    .eq("date", date);

  const attendanceMap = new Map(
    attendanceRecords?.map((r) => [r.student_id, r.status]) ?? []
  );

  const result = (students ?? []).map((s) => ({
    ...s,
    attendance_status: attendanceMap.get(s.id) ?? null,
  }));

  return NextResponse.json(result);
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
  const { date, attendance, batch_id } = body as {
    date: string;
    attendance: { student_id: string; status: "present" | "absent" }[];
    batch_id?: string;
  };

  if (!date || !Array.isArray(attendance) || attendance.length === 0) {
    return NextResponse.json(
      { error: "date and attendance array are required" },
      { status: 400 }
    );
  }

  const { data: institute } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("id", ctx.instituteId)
    .single();

  if (!institute) {
    return NextResponse.json({ error: "Institute not found" }, { status: 404 });
  }

  // Upsert attendance records
  const rows = attendance.map((a) => ({
    institute_id: ctx.instituteId,
    teacher_id: ctx.memberId,
    student_id: a.student_id,
    batch_id: batch_id ?? null,
    date,
    status: a.status,
  }));

  const { error: upsertError } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "student_id,date" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Handle one_to_one session fees
  if (batch_id) {
    const { data: batch } = await supabase
      .from("batches")
      .select("type, session_fee, name")
      .eq("id", batch_id)
      .single();

    if (batch?.type === "one_to_one" && batch.session_fee) {
      const presentStudentIds = attendance
        .filter(a => a.status === "present")
        .map(a => a.student_id);

      for (const studentId of presentStudentIds) {
        await supabase.from("payments").insert({
          institute_id: ctx.instituteId,
          teacher_id: ctx.memberId,
          student_id: studentId,
          amount: Number(batch.session_fee),
          payment_link_id: null,
          status: "paid",
          paid_at: new Date().toISOString(),
          source: "session",
        });
      }
    }
  }

  // Send WhatsApp messages to absent students only
  const absentStudentIds = attendance
    .filter((a) => a.status === "absent")
    .map((a) => a.student_id);

  let absentMessagesSent = 0;

  if (absentStudentIds.length > 0) {
    // Get batch name for the template
    let batchName = institute.name;
    if (batch_id) {
      const { data: batchRow } = await supabase
        .from("batches")
        .select("name")
        .eq("id", batch_id)
        .single();
      if (batchRow?.name) batchName = batchRow.name;
    }

    let absentStudentsQuery = supabase
      .from("students")
      .select("id, student_name, parent_name, parent_phone")
      .in("id", absentStudentIds)
      .eq("institute_id", ctx.instituteId);
    if (ctx.role === "teacher") {
      absentStudentsQuery = absentStudentsQuery.eq(
        "teacher_id",
        ctx.memberId
      );
    }
    const { data: absentStudents } = await absentStudentsQuery;

    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    for (const student of absentStudents ?? []) {
      const phone = formatPhoneForWhatsApp(student.parent_phone ?? "");
      const parentName = student.parent_name ?? "Parent";

      const waResult = await sendTemplate(phone, "absent_notification", [
        parentName,
        student.student_name,
        batchName,
        formattedDate,
      ]);

      if (waResult.success) {
        await supabase.from("whatsapp_logs").insert({
          institute_id: ctx.instituteId,
          teacher_id: ctx.memberId,
          student_id: student.id,
          message_type: "absent",
          status: "sent",
          wamid: waResult.messageId ?? null,
          template_name: "absent_notification",
        });
        absentMessagesSent++;
      }
    }

    const { logActivity } = await import("@/lib/activity");
    await logActivity(supabase, {
      instituteId: ctx.instituteId,
      type: "broadcast_sent",
      studentId: null,
      message: `Attendance marked for ${date}: ${attendance.filter((a) => a.status === "present").length} present, ${absentStudentIds.length} absent. ${absentMessagesSent} absence alerts sent.`,
    });
  }

  return NextResponse.json({
    saved: attendance.length,
    absentMessagesSent,
  });
}
