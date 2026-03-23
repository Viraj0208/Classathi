import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

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
  id: string;
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

  // Verify X-Hub-Signature-256 — mandatory in live mode, optional in mock
  const appSecret = process.env.WA_APP_SECRET;
  const whatsappMode = process.env.WHATSAPP_MODE || "mock";

  if (!appSecret && whatsappMode === "live") {
    console.error("WA_APP_SECRET must be configured when WHATSAPP_MODE=live");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const expectedHex = createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");
    const receivedHex = signature.startsWith("sha256=")
      ? signature.slice(7)
      : "";

    // Timing-safe comparison prevents timing side-channel attacks
    try {
      const isValid = timingSafeEqual(
        Buffer.from(expectedHex, "utf8"),
        Buffer.from(receivedHex, "utf8")
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    } catch {
      // Buffers have different lengths → signature is invalid
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }
  }

  let payload: WebhookBody;
  try {
    payload = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // ── Handle delivery status updates ────────────────────────
      const statuses = change.value?.statuses;
      if (statuses) {
        for (const s of statuses) {
          const newStatus =
            s.status === "delivered"
              ? "delivered"
              : s.status === "read"
                ? "read"
                : s.status === "failed"
                  ? "failed"
                  : null;

          if (!newStatus) continue;

          await supabase
            .from("whatsapp_logs")
            .update({ status: newStatus })
            .eq("wamid", s.id);
        }
      }

    }
  }

  // Always return 200 quickly so Meta doesn't retry
  return NextResponse.json({ success: true });
}
