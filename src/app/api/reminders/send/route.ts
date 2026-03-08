import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createPaymentLink } from "@/lib/razorpay";
import { ensureLedgerEntriesForCurrentMonth } from "@/lib/ledger";
import { logActivity } from "@/lib/activity";
import { getMemberContext } from "@/lib/auth-context";
import { sendTemplate, sendTextMessage, formatPhoneForWhatsApp } from "@/lib/whatsapp";

export async function POST() {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: institute } = await supabase
    .from("institutes")
    .select("id, name, phone")
    .eq("id", ctx.instituteId)
    .single();

  if (!institute) {
    return NextResponse.json({ error: "Institute not found" }, { status: 404 });
  }

  // Fetch the teacher's display name for the template
  const { data: memberRow } = await supabase
    .from("institute_members")
    .select("id, profiles ( full_name )")
    .eq("id", ctx.memberId)
    .single();
  const teacherName =
    (memberRow?.profiles as { full_name?: string } | null)?.full_name ?? institute.name;

  let studentsQuery = supabase
    .from("students")
    .select("id, student_name, parent_name, parent_phone, monthly_fee")
    .eq("institute_id", institute.id);
  if (ctx.role === "teacher") {
    studentsQuery = studentsQuery.eq("teacher_id", ctx.memberId);
  }
  const { data: studentsData } = await studentsQuery;
  const students = studentsData ?? [];

  const teacherStudentIds = ctx.role === "teacher"
    ? students.map((s) => s.id)
    : undefined;

  await ensureLedgerEntriesForCurrentMonth(
    supabase,
    institute.id,
    teacherStudentIds,
    ctx.role === "teacher" ? ctx.memberId : undefined
  );

  const { month, year } = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10);

  let ledgerQuery = supabase
    .from("fee_ledger")
    .select("id, student_id, amount_due, amount_paid, status")
    .eq("institute_id", institute.id)
    .eq("month", monthStart)
    .neq("status", "paid");

  if (ctx.role === "teacher") {
    const teacherStudentIds = students.map((s) => s.id);
    if (teacherStudentIds.length === 0) {
      return NextResponse.json({
        sent: 0,
        total: 0,
        totalExpectedCollection: 0,
        results: [],
      });
    }
    ledgerQuery = ledgerQuery.in("student_id", teacherStudentIds);
  }

  const { data: ledgerEntries } = await ledgerQuery;
  const unpaidLedgers = ledgerEntries ?? [];

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const results: { studentId: string; success: boolean; paymentLink?: string }[] = [];
  let totalExpectedCollection = 0;

  for (const ledger of unpaidLedgers) {
    const student = studentMap.get(ledger.student_id);
    if (!student) continue;

    const due = Number(ledger.amount_due ?? 0);
    const paid = Number(ledger.amount_paid ?? 0);
    const outstanding = Math.max(0, due - paid);
    totalExpectedCollection += outstanding;

    const amount = outstanding > 0 ? outstanding : Number(student.monthly_fee) || 0;
    let paymentLink = "https://pay.razorpay.com/demo";

    if (amount > 0) {
      const link = await createPaymentLink({
        amount,
        description: `Fee for ${student.student_name} - ${institute.name}`,
        studentId: student.id,
        instituteId: institute.id,
        referenceId: `fee-${student.id}-${year}-${month}`,
      });
      if (link) {
        paymentLink = link.short_url;

        await supabase.from("payments").insert({
          institute_id: institute.id,
          teacher_id: ctx.memberId,
          student_id: student.id,
          amount,
          payment_link_id: link.id,
          status: "pending",
          ledger_id: ledger.id,
        });
      }
    }

    const phone = formatPhoneForWhatsApp(student.parent_phone ?? "");
    const parentName = student.parent_name ?? "Parent";

    const waResult = await sendTemplate(phone, "fee_reminder", [
      parentName,
      String(amount),
      student.student_name,
      teacherName,
      paymentLink,
    ]);

    if (waResult.success) {
      await supabase.from("whatsapp_logs").insert({
        institute_id: institute.id,
        teacher_id: ctx.memberId,
        student_id: student.id,
        message_type: "fee",
        status: "sent",
        wamid: waResult.messageId ?? null,
        template_name: "fee_reminder",
      });
      await logActivity(supabase, {
        instituteId: institute.id,
        type: "reminder_sent",
        studentId: student.id,
        message: `Reminder sent to ${student.student_name}`,
      });
    }

    results.push({
      studentId: student.id,
      success: waResult.success,
      paymentLink,
    });
  }

  const totalParentsMessaged = results.filter((r) => r.success).length;

  // Send summary to owner via free-form text (inside 24hr window or as a best-effort)
  if (totalParentsMessaged > 0 && institute.phone) {
    const ownerPhone = formatPhoneForWhatsApp(institute.phone);
    const ownerMessage = `Fee reminders sent to ${totalParentsMessaged} parents.\nExpected collection: ₹${Math.round(totalExpectedCollection)}.\nYou will be notified automatically when parents pay.`;
    await sendTextMessage(ownerPhone, ownerMessage);
  }

  return NextResponse.json({
    sent: totalParentsMessaged,
    total: unpaidLedgers.length,
    totalExpectedCollection,
    results,
  });
}
