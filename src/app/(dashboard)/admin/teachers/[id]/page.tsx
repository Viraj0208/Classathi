import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth-context";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    redirect("/login");
  }
  if (ctx.role !== "owner") redirect("/dashboard");

  const { data: member } = await supabase
    .from("institute_members")
    .select("id, name, subject")
    .eq("id", id)
    .eq("institute_id", ctx.instituteId)
    .single();

  if (!member) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("institute_id", ctx.instituteId)
    .eq("teacher_id", id)
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
        <Link href="/admin/teachers">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to teachers
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{member.name}</CardTitle>
          <p className="text-muted-foreground">
            {member.subject ?? "No subject"} · {students?.length ?? 0} students
          </p>
        </CardHeader>
        <CardContent />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students ({students?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!students?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No students assigned yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Fee Due Day</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.student_name}</TableCell>
                      <TableCell>{s.parent_name}</TableCell>
                      <TableCell>{s.parent_phone}</TableCell>
                      <TableCell>{formatAmount(Number(s.monthly_fee))}</TableCell>
                      <TableCell>{s.fee_due_day}</TableCell>
                      <TableCell>{formatDate(s.created_at)}</TableCell>
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
