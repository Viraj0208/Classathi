"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Plus,
  Trash2,
  Users,
  ClipboardList,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Batch } from "@/lib/db-types";

type BatchWithCount = Batch & { student_count: number };

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Fetch student counts for each batch
        const withCounts: BatchWithCount[] = await Promise.all(
          data.map(async (b: Batch) => {
            const sRes = await fetch(`/api/batches/${b.id}/students`);
            const sData = await sRes.json();
            return {
              ...b,
              student_count: Array.isArray(sData) ? sData.length : 0,
            };
          })
        );
        setBatches(withCounts);
      }
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this batch? This cannot be undone.")) return;
    const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
    if (res.ok) fetchBatches();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batches</h1>
          <p className="text-muted-foreground">
            Manage your classes and one-to-one sessions
          </p>
        </div>
        <Button size="lg" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Batch
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : !batches.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No batches yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Create your first batch to organize students into classes or
              one-to-one sessions.
            </p>
            <div className="mt-4">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{batch.name}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      batch.type === "group"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    )}
                  >
                    {batch.type === "group" ? "Group" : "One-to-One"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {batch.student_count} student
                    {batch.student_count !== 1 ? "s" : ""}
                  </span>
                  {batch.type === "one_to_one" && batch.session_fee && (
                    <span>₹{batch.session_fee}/session</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/attendance?batch_id=${batch.id}`}>
                    <Button variant="outline" size="sm">
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                      Take Attendance
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStudentsModal(batch.id)}
                  >
                    <Users className="mr-1 h-3.5 w-3.5" />
                    Manage Students
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(batch.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateBatchModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchBatches();
          }}
        />
      )}

      {showStudentsModal && (
        <ManageStudentsModal
          batchId={showStudentsModal}
          onClose={() => {
            setShowStudentsModal(null);
            fetchBatches();
          }}
        />
      )}
    </div>
  );
}

function CreateBatchModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"group" | "one_to_one">("group");
  const [sessionFee, setSessionFee] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        session_fee: type === "one_to_one" ? sessionFee : null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      onCreated();
    } else {
      setError(data.error || "Failed to create batch");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create Batch</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Batch Name</Label>
            <Input
              id="batch-name"
              placeholder="e.g. Class 10 Maths"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "group" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("group")}
                className={cn(
                  type === "group" &&
                    "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                )}
              >
                Group Class
              </Button>
              <Button
                type="button"
                variant={type === "one_to_one" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("one_to_one")}
                className={cn(
                  type === "one_to_one" &&
                    "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                )}
              >
                One-to-One Session
              </Button>
            </div>
          </div>

          {type === "one_to_one" && (
            <div className="space-y-2">
              <Label htmlFor="session-fee">Session Fee (₹)</Label>
              <Input
                id="session-fee"
                type="number"
                placeholder="e.g. 500"
                value={sessionFee}
                onChange={(e) => setSessionFee(e.target.value)}
                min="1"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Creating..." : "Create Batch"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type BatchStudent = {
  student_id: string;
  students: {
    id: string;
    student_name: string;
    parent_name: string;
    parent_phone: string;
  };
};

type AllStudent = {
  id: string;
  student_name: string;
};

function ManageStudentsModal({
  batchId,
  onClose,
}: {
  batchId: string;
  onClose: () => void;
}) {
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [allStudents, setAllStudents] = useState<AllStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [bsRes, asRes] = await Promise.all([
      fetch(`/api/batches/${batchId}/students`),
      fetch("/api/students"),
    ]);
    const bsData = await bsRes.json();
    const asData = await asRes.json();
    if (Array.isArray(bsData)) setBatchStudents(bsData);
    if (Array.isArray(asData)) setAllStudents(asData);
    setLoading(false);
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const batchStudentIds = new Set(batchStudents.map((bs) => bs.student_id));
  const availableStudents = allStudents.filter(
    (s) => !batchStudentIds.has(s.id)
  );

  const handleAdd = async () => {
    if (!selectedStudentId) return;
    await fetch(`/api/batches/${batchId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: selectedStudentId }),
    });
    setSelectedStudentId("");
    fetchData();
  };

  const handleRemove = async (studentId: string) => {
    await fetch(`/api/batches/${batchId}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId }),
    });
    fetchData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Students</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Select a student to add...</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.student_name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!selectedStudentId}
                >
                  Add
                </Button>
              </div>

              {batchStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students in this batch yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {batchStudents.map((bs) => (
                    <div
                      key={bs.student_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {bs.students.student_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bs.students.parent_name} &middot;{" "}
                          {bs.students.parent_phone}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(bs.student_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
