import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth-context";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";
import InviteTeacherModal from "./invite-teacher-modal";
import RemoveTeacherButton from "./remove-teacher-button";

export default async function AdminTeachersPage() {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    redirect("/login");
  }
  if (ctx.role !== "owner") redirect("/dashboard");

  const { data: members } = await supabase
    .from("institute_members")
    .select("id, name, subject, role, created_at")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: true });

  const { data: studentCounts } = await supabase
    .from("students")
    .select("teacher_id")
    .eq("institute_id", ctx.instituteId);

  const countMap = new Map<string, number>();
  for (const row of studentCounts ?? []) {
    if (row.teacher_id) {
      countMap.set(row.teacher_id, (countMap.get(row.teacher_id) ?? 0) + 1);
    }
  }

  const teachers = members?.filter((m) => m.role === "teacher") ?? [];

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            Manage teachers and view their students
          </p>
        </div>
        <InviteTeacherModal />
      </div>

      {!teachers.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light dark:bg-primary/10 mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No teachers yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Invite your first teacher to start managing your institute.
          </p>
          <div className="mt-4">
            <InviteTeacherModal />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => {
            const studentCount = countMap.get(t.id) ?? 0;
            return (
              <Card key={t.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light dark:bg-primary/10 text-primary font-semibold">
                        {t.name?.[0]?.toUpperCase() ?? "T"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{t.name}</p>
                        {t.subject ? (
                          <span className="inline-flex items-center rounded-full bg-accent/30 text-accent-foreground px-2 py-0.5 text-xs font-medium mt-1">
                            {t.subject}
                          </span>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No subject
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {studentCount}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      Joined {formatDate(t.created_at)}
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/admin/teachers/${t.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <RemoveTeacherButton
                        memberId={t.id}
                        memberName={t.name}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
