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

export default function AddStudentModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: fd.get("student_name"),
          parent_name: fd.get("parent_name"),
          parent_phone: fd.get("parent_phone"),
          monthly_fee: Number(fd.get("monthly_fee")) || 0,
          fee_due_day: Math.min(31, Math.max(1, Number(fd.get("fee_due_day")) || 1)),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setOpen(false);
      form.reset();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Add student
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student_name">Student name</Label>
              <Input id="student_name" name="student_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_name">Parent name</Label>
              <Input id="parent_name" name="parent_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_phone">Parent phone</Label>
              <Input id="parent_phone" name="parent_phone" type="tel" required placeholder="9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">Monthly fee (₹)</Label>
              <Input id="monthly_fee" name="monthly_fee" type="number" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee_due_day">Fee due day (1-31)</Label>
              <Input id="fee_due_day" name="fee_due_day" type="number" min="1" max="31" defaultValue="1" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Adding..." : "Add student"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
