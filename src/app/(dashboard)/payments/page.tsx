import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: institute } = await supabase
    .from("institutes")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();
  if (!institute) return null;

  const { data: payments } = await supabase
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
    .eq("institute_id", institute.id)
    .order("created_at", { ascending: false });

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "-";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">
          Payment history and status
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All payments</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No payments yet. Send fee reminders to collect.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {(p.students as { student_name?: string })?.student_name ?? "-"}
                      </TableCell>
                      <TableCell>{formatAmount(Number(p.amount))}</TableCell>
                      <TableCell>
                        <span
                          className={
                            p.status === "paid"
                              ? "font-medium text-green-600"
                              : "text-amber-600"
                          }
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(p.paid_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
