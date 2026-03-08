import { SupabaseClient } from "@supabase/supabase-js";

export type MemberContext = {
  userId: string;
  memberId: string;
  instituteId: string;
  role: "owner" | "teacher";
  plan: "pro" | "enterprise";
};

export async function getMemberContext(
  supabase: SupabaseClient
): Promise<MemberContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: member, error: memberError } = await supabase
    .from("institute_members")
    .select(
      `
      id,
      institute_id,
      role,
      institutes (
        plan
      )
    `
    )
    .eq("user_id", user.id)
    // NOTE: .single() is safe here because of UNIQUE(institute_id, user_id).
    // If multi-institute membership is ever supported, replace with .limit(1) and handle the array.
    .single();

  if (memberError || !member) {
    throw new Error("User not fully onboarded");
  }

  // TODO: Replace this cast with generated Supabase types when available (supabase gen types).
  const institute = member.institutes as { plan: "pro" | "enterprise" } | null;
  const plan = institute?.plan ?? "pro";

  return {
    userId: user.id,
    memberId: member.id,
    instituteId: member.institute_id,
    role: member.role as "owner" | "teacher",
    plan,
  };
}
