"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
  created_at: string;
  students: { student_name?: string } | null;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "-";
}

const tabs = [
  { label: "All", value: "all" },
  { label: "Captured", value: "captured" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
] as const;

export default function PaymentsView({
  payments,
}: {
  payments: Payment[];
}) {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? payments
      : payments.filter((p) => p.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(tab.value)}
            className={cn(
              "flex-1 rounded-lg transition-all",
              filter === tab.value &&
                "bg-background shadow-sm text-foreground font-semibold"
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow
                  key={p.id}
                  className={i % 2 === 1 ? "bg-muted/30" : ""}
                >
                  <TableCell className="font-medium">
                    {p.students?.student_name ?? "-"}
                  </TableCell>
                  <TableCell>{formatAmount(Number(p.amount))}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>{formatDate(p.paid_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
