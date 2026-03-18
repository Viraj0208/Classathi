import {
  Users,
  CheckCircle,
  AlertCircle,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import SendRemindersButton from "./send-reminders-button";
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

  const totalStudents = stats?.totalStudents ?? 0;
  const paidCount = stats?.paidThisMonth ?? 0;
  const collectionRate =
    totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400/10 via-card to-card border border-border/50 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-1">
            <TrendingUp className="h-4 w-4" />
            Monthly Overview
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            {collectionRate}% fee collection this month
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Students"
          value={totalStudents}
          accentColor="text-cyan-400"
          iconBgColor="bg-cyan-400/10"
          borderAccent="border-l-cyan-400"
        />
        <StatCard
          icon={CheckCircle}
          title="Paid This Month"
          value={paidCount}
          accentColor="text-emerald-400"
          iconBgColor="bg-emerald-400/10"
          borderAccent="border-l-emerald-400"
        />
        <StatCard
          icon={AlertCircle}
          title="Unpaid This Month"
          value={stats?.unpaidThisMonth ?? 0}
          accentColor="text-red-400"
          iconBgColor="bg-red-400/10"
          borderAccent="border-l-red-400"
        />
        <StatCard
          icon={Banknote}
          title="Outstanding"
          value={formatAmount(stats?.outstandingAmount ?? 0)}
          accentColor="text-amber-400"
          iconBgColor="bg-amber-400/10"
          borderAccent="border-l-amber-400"
        />
      </div>

      {/* Quick actions + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Quick Actions
          </h2>
          <SendRemindersButton />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
