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
import { Plus, Trash2 } from "lucide-react";

type Teacher = {
  id: string;
  name: string;
  subject: string | null;
};

type TeacherAssignment = {
  teacher_id: string;
  monthly_fee: number;
  fee_due_day: number;
};

type Props = {
  teachers?: Teacher[];
  isOwner?: boolean;
};

export default function AddStudentModal({ teachers = [], isOwner = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const router = useRouter();

  function addAssignment() {
    if (teachers.length === 0) return;
    // Default to first teacher not already assigned
    const usedIds = new Set(assignments.map((a) => a.teacher_id));
    const next = teachers.find((t) => !usedIds.has(t.id));
    if (!next) return;
    setAssignments([
      ...assignments,
      { teacher_id: next.id, monthly_fee: 0, fee_due_day: 1 },
    ]);
  }

  function removeAssignment(index: number) {
    setAssignments(assignments.filter((_, i) => i !== index));
  }

  function updateAssignment(index: number, field: keyof TeacherAssignment, value: string | number) {
    setAssignments(
      assignments.map((a, i) =>
        i === index ? { ...a, [field]: field === "teacher_id" ? value : Number(value) } : a
      )
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setError("");

    try {
      // Step 1: Create the student
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: fd.get("student_name"),
          parent_name: fd.get("parent_name"),
          parent_phone: fd.get("parent_phone"),
          monthly_fee: 0,
          fee_due_day: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Step 2: Create teacher assignments if owner added any
      if (isOwner && assignments.length > 0) {
        for (const assignment of assignments) {
          const assignRes = await fetch("/api/student-teachers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: data.id,
              teacher_id: assignment.teacher_id,
              monthly_fee: assignment.monthly_fee,
              fee_due_day: assignment.fee_due_day,
            }),
          });
          if (!assignRes.ok) {
            const assignData = await assignRes.json();
            setError(assignData.error || "Failed to assign teacher");
            return;
          }
        }
      }

      setOpen(false);
      form.reset();
      setAssignments([]);
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
              <Input
                id="parent_phone"
                name="parent_phone"
                type="tel"
                required
                placeholder="9876543210"
              />
            </div>

            {isOwner && teachers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Assign teachers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAssignment}
                    disabled={assignments.length >= teachers.length}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add teacher
                  </Button>
                </div>

                {assignments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No teachers assigned yet. Click &quot;Add teacher&quot; to assign.
                  </p>
                )}

                {assignments.map((assignment, index) => {
                  const usedIds = new Set(
                    assignments
                      .filter((_, i) => i !== index)
                      .map((a) => a.teacher_id)
                  );
                  return (
                    <div
                      key={index}
                      className="rounded-xl border p-3 space-y-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Teacher {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAssignment(index)}
                          className="text-destructive hover:opacity-70"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Label>Teacher</Label>
                        <select
                          value={assignment.teacher_id}
                          onChange={(e) =>
                            updateAssignment(index, "teacher_id", e.target.value)
                          }
                          className="w-full rounded-lg border bg-background px-3 py-2
                                     text-sm focus:outline-none focus:ring-2
                                     focus:ring-primary dark:bg-slate-800"
                        >
                          {teachers
                            .filter(
                              (t) =>
                                !usedIds.has(t.id) ||
                                t.id === assignment.teacher_id
                            )
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                                {t.subject ? ` — ${t.subject}` : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Monthly fee (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={assignment.monthly_fee}
                            onChange={(e) =>
                              updateAssignment(
                                index,
                                "monthly_fee",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Due day</Label>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            value={assignment.fee_due_day}
                            onChange={(e) =>
                              updateAssignment(
                                index,
                                "fee_due_day",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add student"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
