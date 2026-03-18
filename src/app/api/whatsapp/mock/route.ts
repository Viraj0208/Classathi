import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth-context";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  console.log(
    `[WhatsApp Mock] Institute ${ctx.instituteId}:`,
    JSON.stringify(body, null, 2)
  );

  return NextResponse.json({
    success: true,
    message: "Mock WhatsApp message logged",
    payload: body,
  });
}
