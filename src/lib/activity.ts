import { SupabaseClient } from "@supabase/supabase-js";

export type ActivityType =
  | "reminder_sent"
  | "payment_received"
  | "manual_payment"
  | "broadcast_sent";

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    instituteId: string;
    type: ActivityType;
    studentId?: string | null;
    message: string;
  }
): Promise<void> {
  await supabase.from("activity_logs").insert({
    institute_id: params.instituteId,
    type: params.type,
    student_id: params.studentId ?? null,
    message: params.message,
  });
}
