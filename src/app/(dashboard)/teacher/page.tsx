import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Banknote,
  ClipboardList,
  UserPlus,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth-context";
import { getDashboardStats } from "@/lib/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TeacherPage() {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    redirect("/login");
  }

  if (ctx.role !== "teacher") {
    redirect("/dashboard");
  }

  // Get teacher's name and subject
  const { data: member } = await supabase
    .from("institute_members")
    .select("name, subject")
    .eq("id", ctx.memberId)
    .single();

  const stats = await getDashboardStats();

  // Get teacher's batches
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, type")
    .eq("institute_id", ctx.instituteId)
    .eq("teacher_id", ctx.memberId)
    .order("created_at", { ascending: false });

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from("activity_logs")
    .select("id, type, message, created_at")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: false })
    .limit(5);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {member?.name ?? "Teacher"}
        </h1>
        {member?.subject && (
          <p className="text-muted-foreground">{member.subject}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="My Students"
          value={stats?.totalStudents ?? 0}
          accentColor="text-primary"
          iconBgColor="bg-primary-light dark:bg-primary/10"
        />
        <StatCard
          icon={CheckCircle}
          title="Paid This Month"
          value={stats?.paidThisMonth ?? 0}
          accentColor="text-emerald-600 dark:text-emerald-400"
          iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          icon={AlertCircle}
          title="Unpaid"
          value={stats?.unpaidThisMonth ?? 0}
          accentColor="text-red-600 dark:text-red-400"
          iconBgColor="bg-red-50 dark:bg-red-900/20"
        />
        <StatCard
          icon={Banknote}
          title="Outstanding"
          value={formatAmount(stats?.outstandingAmount ?? 0)}
          accentColor="text-amber-600 dark:text-amber-400"
          iconBgColor="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Batches */}
        <Card>
          <CardHeader>
            <CardTitle>My Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {!batches?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No batches yet. Create one from the Batches page.
              </p>
            ) : (
              <div className="space-y-3">
                {batches.map((b) => (
                  <Link
                    key={b.id}
                    href="/batches"
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {b.type === "one_to_one" ? "1-on-1" : "Group"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions + recent activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/attendance">
                <Button variant="outline" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Take Attendance
                </Button>
              </Link>
              <Link href="/students">
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Send Reminders
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentActivity?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p>{a.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
