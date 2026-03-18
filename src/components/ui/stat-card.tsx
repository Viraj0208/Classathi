import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  accentColor?: string;
  iconBgColor?: string;
  borderAccent?: string;
}

export function StatCard({
  icon: Icon,
  title,
  value,
  accentColor = "text-cyan-400",
  iconBgColor = "bg-cyan-400/10",
  borderAccent = "border-l-cyan-400",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:glow-sm border-l-[3px]",
        borderAccent
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("rounded-xl p-2.5", iconBgColor)}>
          <Icon className={cn("h-5 w-5", accentColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className={cn("text-2xl font-bold mt-0.5", accentColor)}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
