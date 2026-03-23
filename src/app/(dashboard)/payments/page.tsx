import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberContext } from "@/lib/auth-context";
import { CreditCard } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Banknote } from "lucide-react";
import PaymentsView from "./payments-view";

export default async function PaymentsPage() {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return null;
  }

  let query = supabase
    .from("payments")
    .select(
      `
      *,
      students (
        student_name,
        parent_name,
        parent_phone
      )
    `
    )
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: false });
  if (ctx.role === "teacher") {
    query = query.eq("teacher_id", ctx.memberId);
  }
  const { data: payments } = await query;

  const paidPayments = (payments ?? []).filter((p) => p.status === "captured");
  const totalCollected = paidPayments.reduce(
    (sum, p) => sum + Number(p.amount ?? 0),
    0
  );

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Payment history and status</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Banknote}
          title="Total Collected"
          value={formatAmount(totalCollected)}
          accentColor="text-emerald-600 dark:text-emerald-400"
          iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          icon={CreditCard}
          title="Total Transactions"
          value={payments?.length ?? 0}
          accentColor="text-primary"
          iconBgColor="bg-primary-light dark:bg-primary/10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light dark:bg-primary/10 mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No payments yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Send fee reminders to start collecting payments.
              </p>
            </div>
          ) : (
            <PaymentsView
              payments={(payments ?? []).map((p) => ({
                ...p,
                students: p.students as { student_name?: string } | null,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
