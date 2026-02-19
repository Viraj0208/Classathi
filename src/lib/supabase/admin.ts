import { createClient } from "@supabase/supabase-js";

// Service role client - use ONLY in API routes, NEVER expose to client
// Bypasses RLS - needed for Razorpay webhook
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
