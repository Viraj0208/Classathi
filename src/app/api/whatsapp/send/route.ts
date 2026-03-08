import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";
import { sendTemplate, formatPhoneForWhatsApp } from "@/lib/whatsapp";

interface SendPayload {
  to: string;
  templateName: string;
  params: string[];
  // Backward compat fields
  institute_name?: string;
  student_name?: string;
  parent_phone?: string;
  due_amount?: number;
  payment_link?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SendPayload;

  // Support the new shape { to, templateName, params }
  // as well as the legacy shape { parent_phone, ... }
  const phone = body.to || body.parent_phone;
  const templateName = body.templateName || "fee_reminder";
  const params = body.params || [
    body.student_name ?? "",
    String(body.due_amount ?? 0),
    body.student_name ?? "",
    body.institute_name ?? "",
    body.payment_link ?? "https://pay.razorpay.com/demo",
  ];

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number (to or parent_phone) is required" },
      { status: 400 }
    );
  }

  const formattedPhone = formatPhoneForWhatsApp(phone);

  try {
    const result = await sendTemplate(formattedPhone, templateName, params);

    // Log to whatsapp_logs
    await supabase.from("whatsapp_logs").insert({
      institute_id: ctx.instituteId,
      teacher_id: ctx.memberId,
      student_id: null,
      message_type: templateName === "fee_reminder" ? "fee" : templateName,
      status: result.success ? "sent" : "failed",
      wamid: result.messageId ?? null,
      template_name: templateName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "WhatsApp send failed", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "WhatsApp send failed", details: String(e) },
      { status: 500 }
    );
  }
}
