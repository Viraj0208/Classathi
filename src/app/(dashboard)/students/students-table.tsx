"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarkPaidButton from "./mark-paid-button";

interface Student {
  id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  monthly_fee: number | string;
  fee_due_day: number;
}

interface StudentTeacherRow {
  id: string;
  student_id: string;
  teacher_id: string;
  monthly_fee: number;
  fee_due_day: number;
}

interface Member {
  id: string;
  name: string;
  subject: string | null;
}

type Props = {
  students: Student[];
  studentTeachers: StudentTeacherRow[];
  members: Member[];
  role: "owner" | "teacher";
  currentMemberId: string;
};

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export default function StudentsTable({
  students,
  studentTeachers,
  members,
  role,
  currentMemberId,
}: Props) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Assign teacher modal state (owner only)
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignFee, setAssignFee] = useState("0");
  const [assignDueDay, setAssignDueDay] = useState("1");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Edit fee modal state (teacher or owner)
  const [editOpen, setEditOpen] = useState(false);
  const [editStId, setEditStId] = useState("");
  const [editFee, setEditFee] = useState("0");
  const [editDueDay, setEditDueDay] = useState("1");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Build lookup: studentId -> teacher assignments
  const teacherMap = new Map<string, StudentTeacherRow[]>();
  for (const st of studentTeachers) {
    const arr = teacherMap.get(st.student_id) ?? [];
    arr.push(st);
    teacherMap.set(st.student_id, arr);
  }

  // Build member name lookup
  const memberNameMap = new Map<string, string>();
  for (const m of members) {
    memberNameMap.set(m.id, m.name);
  }

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.student_name?.toLowerCase().includes(q) ||
      s.parent_name?.toLowerCase().includes(q) ||
      s.parent_phone?.includes(q)
    );
  });

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setAssignLoading(true);
    setAssignError("");
    try {
      const res = await fetch("/api/student-teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: assignStudentId,
          teacher_id: assignTeacherId,
          monthly_fee: Number(assignFee) || 0,
          fee_due_day: Math.min(31, Math.max(1, Number(assignDueDay) || 1)),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssignError(data.error || "Failed to assign");
        return;
      }
      setAssignOpen(false);
      router.refresh();
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleEditFee(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/student-teachers/${editStId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_fee: Number(editFee) || 0,
          fee_due_day: Math.min(31, Math.max(1, Number(editDueDay) || 1)),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update");
        return;
      }
      setEditOpen(false);
      router.refresh();
    } finally {
      setEditLoading(false);
    }
  }

  function openAssign(studentId: string) {
    setAssignStudentId(studentId);
    setAssignTeacherId(members[0]?.id ?? "");
    setAssignFee("0");
    setAssignDueDay("1");
    setAssignError("");
    setAssignOpen(true);
  }

  function openEdit(st: StudentTeacherRow) {
    setEditStId(st.id);
    setEditFee(String(st.monthly_fee));
    setEditDueDay(String(st.fee_due_day));
    setEditError("");
    setEditOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Teachers</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Due day</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No students match your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s, i) => {
                const assignments = teacherMap.get(s.id) ?? [];
                // For teachers, show their specific fee; for owners, show total of all teacher fees
                const myAssignment =
                  role === "teacher"
                    ? assignments.find((a) => a.teacher_id === currentMemberId)
                    : null;
                const assignmentFee =
                  myAssignment != null
                    ? myAssignment.monthly_fee
                    : assignments.reduce((sum, a) => sum + Number(a.monthly_fee), 0);
                const displayFee = assignmentFee > 0 ? assignmentFee : Number(s.monthly_fee) || 0;
                const displayDueDay =
                  myAssignment != null
                    ? myAssignment.fee_due_day
                    : assignments.length > 0
                      ? assignments[0].fee_due_day
                      : 1;

                return (
                  <TableRow
                    key={s.id}
                    className={i % 2 === 1 ? "bg-muted/30" : ""}
                  >
                    <TableCell className="font-medium">
                      {s.student_name}
                    </TableCell>
                    <TableCell>{s.parent_name}</TableCell>
                    <TableCell>{s.parent_phone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignments.map((a) => {
                          const badgeFee = Number(a.monthly_fee) > 0
                            ? a.monthly_fee
                            : Math.floor((Number(s.monthly_fee) || 0) / (assignments.length || 1));
                          return (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                            >
                              {memberNameMap.get(a.teacher_id) ?? "Teacher"}
                              <span className="text-blue-500 dark:text-blue-400">
                                {formatAmount(badgeFee)}
                              </span>
                            </span>
                          );
                        })}
                        {role === "owner" && (
                          <button
                            onClick={() => openAssign(s.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <UserPlus className="h-3 w-3" />
                            Assign
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatAmount(displayFee)}
                    </TableCell>
                    <TableCell>{displayDueDay}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {role === "teacher" && myAssignment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(myAssignment)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {role === "owner" && assignments.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(assignments[0])}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <MarkPaidButton
                          studentId={s.id}
                          studentName={s.student_name}
                          monthlyFee={displayFee}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Teacher Modal (owner only) */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent onClose={() => setAssignOpen(false)}>
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assign-teacher">Teacher</Label>
              <select
                id="assign-teacher"
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.subject ? ` (${m.subject})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-fee">Monthly fee for this teacher</Label>
              <Input
                id="assign-fee"
                type="number"
                min="0"
                value={assignFee}
                onChange={(e) => setAssignFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-due-day">Fee due day (1-31)</Label>
              <Input
                id="assign-due-day"
                type="number"
                min="1"
                max="31"
                value={assignDueDay}
                onChange={(e) => setAssignDueDay(e.target.value)}
              />
            </div>
            {assignError && (
              <p className="text-sm text-destructive">{assignError}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={assignLoading}
            >
              {assignLoading ? "Assigning..." : "Assign Teacher"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => setAssignOpen(false)}
              disabled={assignLoading}
            >
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onClose={() => setEditOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Fee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFee} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fee">Monthly fee</Label>
              <Input
                id="edit-fee"
                type="number"
                min="0"
                value={editFee}
                onChange={(e) => setEditFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-due-day">Fee due day (1-31)</Label>
              <Input
                id="edit-due-day"
                type="number"
                min="1"
                max="31"
                value={editDueDay}
                onChange={(e) => setEditDueDay(e.target.value)}
              />
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => setEditOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
