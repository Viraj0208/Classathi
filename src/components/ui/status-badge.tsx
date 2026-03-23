import { cn } from "@/lib/utils";

type Status = "paid" | "captured" | "unpaid" | "partial" | "pending" | "failed" | "refunded" | "expired";

const statusStyles: Record<Status, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  captured: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  partial:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  pending:
    "bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400",
  failed:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  expired:
    "bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = (status ?? "pending") as Status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        statusStyles[key] ?? statusStyles.pending,
        className
      )}
    >
      {status}
    </span>
  );
}
