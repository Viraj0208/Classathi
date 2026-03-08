"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Batch } from "@/lib/db-types";

type StudentRow = {
  id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  attendance_status: "present" | "absent" | null;
};

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get("batch_id") ?? "";

  const today = formatDateForInput(new Date());
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<string, "present" | "absent">>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Fetch batches on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/batches");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setBatches(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Track selected batch details
  useEffect(() => {
    if (selectedBatchId) {
      const b = batches.find((b) => b.id === selectedBatchId);
      setSelectedBatch(b ?? null);
    } else {
      setSelectedBatch(null);
    }
  }, [selectedBatchId, batches]);

  const fetchAttendance = useCallback(async (d: string, batchId: string) => {
    setLoading(true);
    try {
      let url = `/api/attendance?date=${d}`;
      if (batchId) url += `&batch_id=${batchId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setStudents(data);
        const initial: Record<string, "present" | "absent"> = {};
        for (const s of data) {
          initial[s.id] = s.attendance_status ?? "present";
        }
        setLocalStatus(initial);
      } else {
        setStudents([]);
        setLocalStatus({});
      }
    } catch {
      setStudents([]);
      setLocalStatus({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance(date, selectedBatchId);
  }, [date, selectedBatchId, fetchAttendance]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setSuccessMessage(null);
  };

  const setStatus = (studentId: string, status: "present" | "absent") => {
    setLocalStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const hasExistingRecords = students.some((s) => s.attendance_status !== null);
  const absentCount = Object.values(localStatus).filter((v) => v === "absent").length;

  const handleMarkAttendance = () => {
    if (absentCount > 0) {
      setShowConfirmModal(true);
    } else {
      submitAttendance();
    }
  };

  const submitAttendance = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          batch_id: selectedBatchId || undefined,
          attendance: students.map((s) => ({
            student_id: s.id,
            status: localStatus[s.id] ?? "present",
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(
          `Attendance saved. ${data.absentMessagesSent ?? 0} absence alerts sent.`
        );
        fetchAttendance(date, selectedBatchId);
      } else {
        setSuccessMessage(data.error || "Something went wrong");
      }
    } catch {
      setSuccessMessage("Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Mark daily attendance and notify parents of absences
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="attendance-date" className="whitespace-nowrap">
            Date
          </Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Batch selector */}
      {batches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedBatchId === "" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedBatchId("");
              setSuccessMessage(null);
            }}
          >
            All Students
          </Button>
          {batches.map((b) => (
            <Button
              key={b.id}
              variant={selectedBatchId === b.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedBatchId(b.id);
                setSuccessMessage(null);
              }}
              className={cn(
                selectedBatchId === b.id &&
                  b.type === "group" &&
                  "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
                selectedBatchId === b.id &&
                  b.type === "one_to_one" &&
                  "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
              )}
            >
              {b.name}
            </Button>
          ))}
        </div>
      )}

      {/* One-to-one session fee notice */}
      {selectedBatch?.type === "one_to_one" && selectedBatch.session_fee && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200">
          Session fee of ₹{selectedBatch.session_fee} will be automatically
          recorded for each present student.
        </div>
      )}

      {successMessage && (
        <div
          className={cn(
            "rounded-xl border p-4",
            successMessage.startsWith("Attendance saved")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          )}
        >
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Students ({students.length})
          </CardTitle>
          {hasExistingRecords && (
            <p className="text-sm text-muted-foreground">
              Attendance already recorded for this date — you can update it
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : !students.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No students</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {selectedBatchId
                  ? "No students in this batch. Add students from the Batches page."
                  : "Add students to mark attendance."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => {
                const status = localStatus[s.id] ?? "present";
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border-l-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                      status === "present"
                        ? "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                        : "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.student_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.parent_name} · {s.parent_phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={status === "present" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatus(s.id, "present")}
                        className={cn(
                          status === "present" &&
                            "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        )}
                      >
                        Present
                      </Button>
                      <Button
                        variant={status === "absent" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setStatus(s.id, "absent")}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="mt-6">
              <Button
                size="lg"
                onClick={handleMarkAttendance}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Mark Attendance"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Confirm attendance</CardTitle>
              <p className="text-sm text-muted-foreground">
                {absentCount} absent student{absentCount !== 1 ? "s" : ""} will
                receive a WhatsApp message to their parent. Continue?
              </p>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitAttendance} disabled={submitting}>
                {submitting ? "Saving..." : "Confirm"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
