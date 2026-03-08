import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  accentColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  icon: Icon,
  title,
  value,
  accentColor = "text-primary",
  iconBgColor = "bg-primary-light dark:bg-primary/10",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        <div className={cn("rounded-xl p-3", iconBgColor)}>
          <Icon className={cn("h-6 w-6", accentColor)} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold", accentColor)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
