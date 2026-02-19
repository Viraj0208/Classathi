import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createPaymentLink } from "@/lib/razorpay";

interface SendPayload {
  institute_name: string;
  student_name: string;
  parent_phone: string;
  due_amount: number;
  payment_link?: string;
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
    .select("id, name")
    .eq("owner_user_id", user.id)
    .single();

  if (!institute) {
    return NextResponse.json({ error: "Institute not found" }, { status: 404 });
  }

  const body = (await request.json()) as SendPayload;
  const { institute_name, student_name, parent_phone, due_amount, payment_link } = body;

  if (!institute_name || !student_name || !parent_phone) {
    return NextResponse.json(
      { error: "institute_name, student_name, parent_phone required" },
      { status: 400 }
    );
  }

  const finalPaymentLink =
    payment_link ||
    "https://pay.razorpay.com/demo"; // fallback for mock

  const payload = {
    institute_name,
    student_name,
    parent_phone,
    due_amount: due_amount ?? 0,
    payment_link: finalPaymentLink,
  };

  try {
    const mockUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whatsapp/mock`;
    const res = await fetch(mockUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const mockResult = await res.json();
    return NextResponse.json({ success: true, mock: mockResult });
  } catch (e) {
    return NextResponse.json(
      { error: "WhatsApp send failed", details: String(e) },
      { status: 500 }
    );
  }
}
