"use client";

import { useState, useRef } from "react";
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
import { Plus, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

type StudentForDupCheck = {
  student_name: string;
  parent_phone: string;
};

type StudentPayload = {
  student_name: string;
  parent_name: string;
  parent_phone: string;
  monthly_fee: number;
  fee_due_day: number;
};

type Props = {
  teachers?: Teacher[];
  isOwner?: boolean;
  students?: StudentForDupCheck[];
};

export default function AddStudentModal({
  teachers = [],
  isOwner = false,
  students = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [pendingPayload, setPendingPayload] = useState<StudentPayload | null>(
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleClose() {
    setOpen(false);
    setError("");
    setDuplicateWarning("");
    setPendingPayload(null);
    if (success) {
      setSuccess(false);
      router.refresh();
    }
  }

  function handleAddAnother() {
    setSuccess(false);
    setError("");
    setDuplicateWarning("");
    setPendingPayload(null);
    setAssignments([]);
  }

  function addAssignment() {
    if (teachers.length === 0) return;
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

  function updateAssignment(
    index: number,
    field: keyof TeacherAssignment,
    value: string | number
  ) {
    setAssignments(
      assignments.map((a, i) =>
        i === index
          ? { ...a, [field]: field === "teacher_id" ? value : Number(value) }
          : a
      )
    );
  }

  async function createStudentWithAssignments(
    payload: StudentPayload,
    force: boolean
  ): Promise<boolean> {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, force }),
    });
    const data: { id?: string; error?: string; message?: string } =
      await res.json();

    if (res.status === 409 && !force) {
      setDuplicateWarning(
        data.message ||
          "A student with the same name and phone already exists. Add anyway?"
      );
      setPendingPayload(payload);
      return false;
    }

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return false;
    }

    if (isOwner && assignments.length > 0 && data.id) {
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
          const assignData: { error?: string } = await assignRes.json();
          setError(assignData.error || "Failed to assign teacher");
          return false;
        }
      }
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const fd = new FormData(e.currentTarget);
    const studentName = String(fd.get("student_name")).trim();
    const parentPhone = String(fd.get("parent_phone")).trim();

    const payload: StudentPayload = {
      student_name: studentName,
      parent_name: String(fd.get("parent_name")).trim(),
      parent_phone: parentPhone,
      monthly_fee: !isOwner ? Number(fd.get("monthly_fee")) || 0 : 0,
      fee_due_day: !isOwner
        ? Math.min(31, Math.max(1, Number(fd.get("fee_due_day")) || 1))
        : 1,
    };

    // Client-side duplicate check
    if (students.length > 0) {
      const normalizedPhone = parentPhone.replace(/\D/g, "").slice(-10);
      const dup = students.find(
        (s) =>
          s.student_name.toLowerCase().trim() === studentName.toLowerCase() &&
          s.parent_phone.replace(/\D/g, "").slice(-10) === normalizedPhone
      );
      if (dup) {
        setDuplicateWarning(
          `A student named "${dup.student_name}" with phone ${dup.parent_phone} already exists. Add anyway?`
        );
        setPendingPayload(payload);
        return;
      }
    }

    setLoading(true);
    setError("");
    setDuplicateWarning("");

    try {
      const ok = await createStudentWithAssignments(payload, false);
      if (ok) {
        formRef.current?.reset();
        setAssignments([]);
        setSuccess(true);
        setPendingPayload(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForceAdd() {
    if (!pendingPayload || loading) return;
    setLoading(true);
    setError("");
    setDuplicateWarning("");

    try {
      const ok = await createStudentWithAssignments(pendingPayload, true);
      if (ok) {
        formRef.current?.reset();
        setAssignments([]);
        setSuccess(true);
        setPendingPayload(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Add student
      </Button>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onClose={handleClose}
        >
          {success ? (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">Student added!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The student has been added successfully.
                </p>
              </div>
              <div className="flex flex-col w-full gap-2">
                <Button size="lg" onClick={handleAddAnother}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add another student
                </Button>
                <Link href="/dashboard" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" onClick={handleClose}>
                  Stay on this page
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add student</DialogTitle>
              </DialogHeader>
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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

                {!isOwner && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_fee">Monthly fee (₹)</Label>
                      <Input
                        id="monthly_fee"
                        name="monthly_fee"
                        type="number"
                        min="0"
                        required
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fee_due_day">Due day (1-31)</Label>
                      <Input
                        id="fee_due_day"
                        name="fee_due_day"
                        type="number"
                        min="1"
                        max="31"
                        defaultValue="1"
                        required
                      />
                    </div>
                  </div>
                )}

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
                        No teachers assigned yet. Click &quot;Add teacher&quot;
                        to assign.
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
                                updateAssignment(
                                  index,
                                  "teacher_id",
                                  e.target.value
                                )
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

                {duplicateWarning && (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-3 space-y-2">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {duplicateWarning}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDuplicateWarning("");
                          setPendingPayload(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleForceAdd}
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add anyway"}
                      </Button>
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add student"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
