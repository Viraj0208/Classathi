const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function createPaymentLink(params: {
  amount: number;
  description: string;
  studentId: string;
  instituteId: string;
  referenceId: string;
}): Promise<{ short_url: string; id: string } | null> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn("Razorpay credentials not configured");
    return null;
  }

  const amountInPaise = Math.round(params.amount * 100);

  const body = {
    amount: amountInPaise,
    currency: "INR",
    description: params.description,
    customer: {
      notify: {
        sms: false,
        email: false,
      },
    },
    notify: {
      sms: false,
      email: false,
    },
    callback_url: `${APP_URL}/payments?success=1`,
    callback_method: "get",
    reference_id: params.referenceId,
    notes: {
      student_id: params.studentId,
      institute_id: params.instituteId,
    },
  };

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Razorpay create link error:", err);
    return null;
  }

  const data = (await res.json()) as { short_url: string; id: string };
  return { short_url: data.short_url, id: data.id };
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}
