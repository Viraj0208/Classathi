import { createClient } from "@/lib/supabase/server";
import { ensureLedgerEntriesForCurrentMonth } from "./ledger";

export async function getDashboardStats() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: institute } = await supabase
    .from("institutes")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!institute) return null;

  const instituteId = institute.id;

  await ensureLedgerEntriesForCurrentMonth(supabase, instituteId);

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("institute_id", instituteId);
  const totalStudents = students?.length ?? 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data: ledgerEntries } = await supabase
    .from("fee_ledger")
    .select("id, amount_due, amount_paid, status")
    .eq("institute_id", instituteId)
    .eq("month", monthStart);

  let paidThisMonth = 0;
  let unpaidThisMonth = 0;
  let outstandingAmount = 0;

  for (const entry of ledgerEntries ?? []) {
    if (entry.status === "paid") {
      paidThisMonth++;
    } else {
      unpaidThisMonth++;
      const due = Number(entry.amount_due ?? 0);
      const paid = Number(entry.amount_paid ?? 0);
      outstandingAmount += Math.max(0, due - paid);
    }
  }

  return {
    totalStudents,
    paidThisMonth,
    unpaidThisMonth,
    outstandingAmount,
  };
}
