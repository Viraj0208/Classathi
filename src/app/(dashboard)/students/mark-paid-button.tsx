"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  studentId: string;
  studentName: string;
  monthlyFee: number;
};

export default function MarkPaidButton({
  studentId,
  studentName,
  monthlyFee,
}: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(monthlyFee || 0));
  const [method, setMethod] = useState<"cash" | "upi">("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          amount: amt,
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setAmount(String(monthlyFee || 0));
          setOpen(true);
        }}
      >
        Mark Paid
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark paid — {studentName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={method === "cash" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMethod("cash")}
                >
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={method === "upi" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMethod("upi")}
                >
                  UPI
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Mark paid"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
