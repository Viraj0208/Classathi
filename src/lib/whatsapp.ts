import { buildTemplateComponents } from "./whatsapp-templates";

const WHATSAPP_MODE = process.env.WHATSAPP_MODE ?? "mock";
export const WHATSAPP_ENABLED = WHATSAPP_MODE === "live";

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID ?? "";
const CLOUD_API_ACCESS_TOKEN = process.env.CLOUD_API_ACCESS_TOKEN ?? "";
const GRAPH_API_URL = `https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`;
const MOCK_URL = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whatsapp/mock`;

export type WhatsAppResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

type TemplateComponent = {
  type: string;
  parameters?: { type: string; text: string }[];
};

/**
 * Normalise an Indian phone number to E.164 without the leading '+'.
 * WhatsApp Cloud API expects e.g. "919876543210".
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  // Already has country code (91XXXXXXXXXX or 091XXXXXXXXXX)
  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("091") && digits.length === 13) {
    return digits.slice(1);
  }

  // Fallback: return as-is (best-effort)
  return digits;
}

/**
 * Send a WhatsApp template message via the Meta Cloud API.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components: TemplateComponent[]
): Promise<WhatsAppResult> {
  if (!WHATSAPP_ENABLED) {
    return sendMock({ to, templateName, components });
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  try {
    const res = await fetch(GRAPH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message ?? `HTTP ${res.status}`,
      };
    }

    const messageId: string | undefined = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Send a free-form text message (only within the 24-hour customer service window).
 */
export async function sendTextMessage(
  to: string,
  body: string
): Promise<WhatsAppResult> {
  if (!WHATSAPP_ENABLED) {
    return sendMock({ to, type: "text", body });
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };

  try {
    const res = await fetch(GRAPH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message ?? `HTTP ${res.status}`,
      };
    }

    const messageId: string | undefined = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Convenience: send a template by name using the pre-defined template registry.
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  paramValues: string[]
): Promise<WhatsAppResult> {
  const components = buildTemplateComponents(templateName, paramValues);
  // All Classaathi templates use English
  return sendWhatsAppTemplate(to, templateName, "en", components);
}

// ── Mock helper ──────────────────────────────────────────────────────────
async function sendMock(data: Record<string, unknown>): Promise<WhatsAppResult> {
  try {
    const res = await fetch(MOCK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: `Mock endpoint returned ${res.status}` };
    }

    // Generate a fake wamid so callers can still store it
    const fakeId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { success: true, messageId: fakeId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
