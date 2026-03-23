import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import AddStudentModal from "./add-student-modal";
import CsvUpload from "./csv-upload";
import { Button } from "@/components/ui/button";
import { getMemberContext } from "@/lib/auth-context";
import { UserPlus } from "lucide-react";
import StudentsTable from "./students-table";

export default async function StudentsPage() {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return null;
  }

  let query = supabase
    .from("students")
    .select("*")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: false });
  if (ctx.role === "teacher") {
    query = query.eq("teacher_id", ctx.memberId);
  }
  const { data: students } = await query;

  // Fetch student_teachers assignments with teacher names
  const { data: studentTeachers } = await supabase
    .from("student_teachers")
    .select("id, student_id, teacher_id, monthly_fee, fee_due_day")
    .eq("institute_id", ctx.instituteId);

  // Fetch members (teachers) for assignment dropdown (owners only)
  let members: { id: string; name: string; subject: string | null }[] = [];
  if (ctx.role === "owner") {
    const { data: membersData } = await supabase
      .from("institute_members")
      .select("id, name, subject")
      .eq("institute_id", ctx.instituteId)
      .order("name");
    members = membersData ?? [];
  }

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
          <AddStudentModal
            teachers={members}
            isOwner={ctx.role === "owner"}
            students={students ?? []}
          />
          <CsvUpload />
          <Link href="/api/students/template" download="students_template.csv">
            <Button variant="outline" size="lg">
              Download Template
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light dark:bg-primary/10 mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No students yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Add your first student or upload a CSV file to get started.
              </p>
              <div className="mt-4">
                <AddStudentModal
                  teachers={members}
                  isOwner={ctx.role === "owner"}
                  students={students ?? []}
                />
              </div>
            </div>
          ) : (
            <StudentsTable
              students={students}
              studentTeachers={studentTeachers ?? []}
              members={members}
              role={ctx.role}
              currentMemberId={ctx.memberId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
