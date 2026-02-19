import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  console.log("[WhatsApp Mock] Received:", JSON.stringify(body, null, 2));

  return NextResponse.json({
    success: true,
    message: "Mock WhatsApp message logged",
    payload: body,
  });
}
