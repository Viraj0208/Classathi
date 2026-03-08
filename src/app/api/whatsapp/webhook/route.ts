import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

// ── GET: Meta webhook verification ──────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WA_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ── POST: Delivery status updates & incoming messages ───────────────────

type StatusUpdate = {
  id: string;                              // wamid
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  errors?: { code: number; title: string }[];
};

type WebhookChange = {
  value: {
    messaging_product: string;
    metadata: { phone_number_id: string };
    statuses?: StatusUpdate[];
  };
};

type WebhookEntry = {
  id: string;
  changes: WebhookChange[];
};

type WebhookBody = {
  object: string;
  entry: WebhookEntry[];
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Optional: verify X-Hub-Signature-256
  const appSecret = process.env.WA_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let payload: WebhookBody;
  try {
    payload = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Process in the background-ish manner (we still respond 200 immediately-ish)
  const supabase = createAdminClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const statuses = change.value?.statuses;
      if (!statuses) continue;

      for (const s of statuses) {
        // Map WhatsApp status to our stored status
        const newStatus =
          s.status === "delivered" ? "delivered" :
          s.status === "read" ? "read" :
          s.status === "failed" ? "failed" :
          null;

        if (!newStatus) continue;

        await supabase
          .from("whatsapp_logs")
          .update({ status: newStatus })
          .eq("wamid", s.id);
      }
    }
  }

  // Always return 200 quickly so Meta doesn't retry
  return NextResponse.json({ success: true });
}
