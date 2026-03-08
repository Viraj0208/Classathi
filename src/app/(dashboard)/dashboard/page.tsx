import { Users, CheckCircle, AlertCircle, Banknote } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import SendRemindersButton from "./send-reminders-button";
import BroadcastButtons from "./broadcast-buttons";
import RecentActivity from "./recent-activity";
import { getDashboardStats } from "@/lib/dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Fee overview this month</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Students"
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
          title="Unpaid This Month"
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <SendRemindersButton />
          <BroadcastButtons />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
