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
import Link from "next/link";
import AddStudentModal from "./add-student-modal";
import CsvUpload from "./csv-upload";
import MarkPaidButton from "./mark-paid-button";
import { Button } from "@/components/ui/button";

export default async function StudentsPage() {
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

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("institute_id", institute.id)
    .order("created_at", { ascending: false });

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage students and parent contacts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddStudentModal />
          <CsvUpload />
          <Link href="/api/students/template" download="students_template.csv">
            <Button variant="outline" size="lg">
              Download Excel Template
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All students ({students?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!students?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No students yet. Add one or upload CSV.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Due day</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                      <TableCell className="text-right">
                        <MarkPaidButton
                          studentId={s.id}
                          studentName={s.student_name}
                          monthlyFee={Number(s.monthly_fee)}
                        />
                      </TableCell>
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
