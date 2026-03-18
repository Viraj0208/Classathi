"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  BookOpen,
  UserX,
  FileText,
  Clock,
  Send,
  CheckCircle,
  Users,
  Filter,
  ChevronDown,
  User,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────── */

type BroadcastType = "homework" | "absent" | "test" | "timing_change";
type DeliveryMode = "individual" | "group";
type AudienceScope = "all" | "batch" | "single";

type Batch = { id: string; name: string };
type Student = { id: string; student_name: string };

type FormData = {
  subject: string;
  message: string;
  date: string;
  originalTime: string;
  newTime: string;
  cancelled: boolean;
};

const BROADCAST_TYPES: {
  key: BroadcastType;
  label: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    key: "homework",
    label: "Homework Reminder",
    description: "Notify parents about homework assigned today",
    icon: BookOpen,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/30",
  },
  {
    key: "absent",
    label: "Absence Alert",
    description: "Alert parents about their child's absence",
    icon: UserX,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
  },
  {
    key: "test",
    label: "Test Announcement",
    description: "Inform parents about upcoming tests or exams",
    icon: FileText,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
  },
  {
    key: "timing_change",
    label: "Class Timing / Cancelled",
    description: "Notify about class timing change or cancellation",
    icon: Clock,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
  },
];

/* ── Helpers ───────────────────────────────────────────────────────── */

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function BroadcastPage() {
  const [selectedType, setSelectedType] = useState<BroadcastType | null>(null);
  const [form, setForm] = useState<FormData>({
    subject: "",
    message: "",
    date: todayISO(),
    originalTime: "",
    newTime: "",
    cancelled: false,
  });

  /* delivery + audience */
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("individual");
  const [audienceScope, setAudienceScope] = useState<AudienceScope>("all");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  /* data */
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batchStudents, setBatchStudents] = useState<Student[]>([]);

  /* status */
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(
    null
  );
  const [error, setError] = useState("");

  /* ── fetch data on mount ────────────────────────────────────────── */

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBatches(data);
      });
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      });
  }, []);

  /* fetch batch students when a batch is selected */
  const loadBatchStudents = useCallback(async (batchId: string) => {
    if (!batchId) {
      setBatchStudents([]);
      return;
    }
    const res = await fetch(`/api/batches/${batchId}/students`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const mapped = data.map(
        (row: { student_id: string; students: Student }) => ({
          id: row.students?.id ?? row.student_id,
          student_name: row.students?.student_name ?? "Unknown",
        })
      );
      setBatchStudents(mapped);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchStudents(selectedBatchId);
    } else {
      setBatchStudents([]);
    }
  }, [selectedBatchId, loadBatchStudents]);

  /* ── derived values ─────────────────────────────────────────────── */

  // When group mode, audience is always the selected batch
  const effectiveScope = deliveryMode === "group" ? "batch" : audienceScope;

  let targetIds: string[] = [];
  if (effectiveScope === "all") {
    targetIds = students.map((s) => s.id);
  } else if (effectiveScope === "batch") {
    targetIds = batchStudents.map((s) => s.id);
  } else if (effectiveScope === "single" && selectedStudentId) {
    targetIds = [selectedStudentId];
  }

  const recipientLabel =
    effectiveScope === "single" && selectedStudentId
      ? students.find((s) => s.id === selectedStudentId)?.student_name ??
        "1 student"
      : `${targetIds.length} student${targetIds.length !== 1 ? "s" : ""}`;

  const canSend =
    selectedType !== null &&
    targetIds.length > 0 &&
    !sending &&
    (deliveryMode !== "group" || selectedBatchId !== "") &&
    (selectedType !== "homework" || form.message.trim() !== "") &&
    (selectedType !== "test" || form.message.trim() !== "") &&
    (selectedType !== "timing_change" ||
      form.cancelled ||
      form.newTime.trim() !== "");

  /* ── send handler ───────────────────────────────────────────────── */

  async function handleSend() {
    if (!selectedType || !canSend) return;
    setSending(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          student_ids: targetIds,
          subject: form.subject || undefined,
          message: buildMessage(),
          date: form.date || undefined,
          delivery_mode: deliveryMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult({ sent: data.sent, total: data.total });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function buildMessage(): string {
    switch (selectedType) {
      case "homework":
        return form.message;
      case "test":
        return form.message;
      case "timing_change":
        if (form.cancelled) {
          return `Class on ${formatDate(form.date)} has been cancelled. ${form.message}`.trim();
        }
        return `Class timing changed on ${formatDate(form.date)}. Original: ${form.originalTime}. New time: ${form.newTime}. ${form.message}`.trim();
      case "absent":
        return form.message || "";
      default:
        return form.message;
    }
  }

  function formatDate(iso: string) {
    if (!iso) return "today";
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function resetForm() {
    setForm({
      subject: "",
      message: "",
      date: todayISO(),
      originalTime: "",
      newTime: "",
      cancelled: false,
    });
    setResult(null);
    setError("");
  }

  function selectType(type: BroadcastType) {
    setSelectedType(type);
    resetForm();
  }

  /* ── render ─────────────────────────────────────────────────────── */

  const typeConfig = BROADCAST_TYPES.find((t) => t.key === selectedType);
  const selectedBatchName =
    batches.find((b) => b.id === selectedBatchId)?.name ?? "";

  return (
    <div className="max-w-5xl space-y-8">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-card to-card border border-border/50 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-purple-400/10 p-3">
            <Megaphone className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Broadcast Messages
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Send WhatsApp messages to students&apos; parents
            </p>
          </div>
        </div>
      </div>

      {/* Type selection */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Select Message Type
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BROADCAST_TYPES.map((bt) => (
            <button
              key={bt.key}
              onClick={() => selectType(bt.key)}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition-all duration-200",
                selectedType === bt.key
                  ? cn(bt.borderColor, bt.bgColor, "ring-1", bt.borderColor)
                  : "border-border/50 bg-card hover:border-border hover:bg-accent/30"
              )}
            >
              <div className={cn("rounded-xl p-2.5 w-fit mb-3", bt.bgColor)}>
                <bt.icon className={cn("h-5 w-5", bt.color)} />
              </div>
              <p className="font-semibold text-sm text-foreground">
                {bt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {bt.description}
              </p>
              {selectedType === bt.key && (
                <div className={cn("absolute top-3 right-3", bt.color)}>
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form area */}
      {selectedType && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {typeConfig && (
                  <typeConfig.icon
                    className={cn("h-4 w-4", typeConfig.color)}
                  />
                )}
                Message Details
              </h3>

              {/* Homework */}
              {selectedType === "homework" && (
                <>
                  <FieldGroup label="Subject / Topic">
                    <DarkInput
                      placeholder="e.g. Mathematics, English"
                      value={form.subject}
                      onChange={(v) => setForm({ ...form, subject: v })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Date">
                    <DarkInput
                      type="date"
                      value={form.date}
                      onChange={(v) => setForm({ ...form, date: v })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Homework Details *">
                    <DarkTextarea
                      placeholder="e.g. Complete Exercise 5.1, questions 1-10 from NCERT textbook"
                      value={form.message}
                      onChange={(v) => setForm({ ...form, message: v })}
                      rows={3}
                    />
                  </FieldGroup>
                </>
              )}

              {/* Absence */}
              {selectedType === "absent" && (
                <>
                  <FieldGroup label="Date">
                    <DarkInput
                      type="date"
                      value={form.date}
                      onChange={(v) => setForm({ ...form, date: v })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Additional Note (optional)">
                    <DarkTextarea
                      placeholder="e.g. Please ensure regular attendance"
                      value={form.message}
                      onChange={(v) => setForm({ ...form, message: v })}
                      rows={2}
                    />
                  </FieldGroup>
                </>
              )}

              {/* Test */}
              {selectedType === "test" && (
                <>
                  <FieldGroup label="Subject / Exam Name">
                    <DarkInput
                      placeholder="e.g. Mathematics Unit Test"
                      value={form.subject}
                      onChange={(v) => setForm({ ...form, subject: v })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Test Date">
                    <DarkInput
                      type="date"
                      value={form.date}
                      onChange={(v) => setForm({ ...form, date: v })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Test Details / Syllabus *">
                    <DarkTextarea
                      placeholder="e.g. Chapters 1-5, focus on trigonometry and algebra"
                      value={form.message}
                      onChange={(v) => setForm({ ...form, message: v })}
                      rows={3}
                    />
                  </FieldGroup>
                </>
              )}

              {/* Timing change / cancelled */}
              {selectedType === "timing_change" && (
                <>
                  <FieldGroup label="Date">
                    <DarkInput
                      type="date"
                      value={form.date}
                      onChange={(v) => setForm({ ...form, date: v })}
                    />
                  </FieldGroup>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cancelled: false })}
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                        !form.cancelled
                          ? "border-purple-400/30 bg-purple-400/10 text-purple-400"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      Timing Changed
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cancelled: true })}
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                        form.cancelled
                          ? "border-red-400/30 bg-red-400/10 text-red-400"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      Class Cancelled
                    </button>
                  </div>
                  {!form.cancelled && (
                    <>
                      <FieldGroup label="Original Time">
                        <DarkInput
                          type="time"
                          value={form.originalTime}
                          onChange={(v) =>
                            setForm({ ...form, originalTime: v })
                          }
                        />
                      </FieldGroup>
                      <FieldGroup label="New Time *">
                        <DarkInput
                          type="time"
                          value={form.newTime}
                          onChange={(v) => setForm({ ...form, newTime: v })}
                        />
                      </FieldGroup>
                    </>
                  )}
                  <FieldGroup label="Additional Note (optional)">
                    <DarkTextarea
                      placeholder={
                        form.cancelled
                          ? "e.g. Due to a holiday, class is cancelled"
                          : "e.g. Please adjust your schedule accordingly"
                      }
                      value={form.message}
                      onChange={(v) => setForm({ ...form, message: v })}
                      rows={2}
                    />
                  </FieldGroup>
                </>
              )}
            </div>
          </div>

          {/* ── Sidebar: Delivery mode + Audience + Send ──────────── */}
          <div className="space-y-4">
            {/* Delivery mode */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                Delivery Mode
              </h3>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("individual");
                    setAudienceScope("all");
                    setSelectedBatchId("");
                    setSelectedStudentId("");
                  }}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-3 text-center text-sm font-medium transition-all",
                    deliveryMode === "individual"
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  )}
                >
                  <User className="h-5 w-5 mx-auto mb-1.5" />
                  Individual DM
                  <p className="text-[10px] mt-0.5 opacity-70 font-normal">
                    Personalised per parent
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("group");
                    setAudienceScope("batch");
                    setSelectedStudentId("");
                  }}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-3 text-center text-sm font-medium transition-all",
                    deliveryMode === "group"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  )}
                >
                  <UsersRound className="h-5 w-5 mx-auto mb-1.5" />
                  Batch Group
                  <p className="text-[10px] mt-0.5 opacity-70 font-normal">
                    Generic to all in batch
                  </p>
                </button>
              </div>
            </div>

            {/* Audience */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                Send To
              </h3>

              {deliveryMode === "individual" && (
                <>
                  {/* scope toggle */}
                  <div className="flex gap-1.5">
                    {(
                      [
                        { key: "all", label: "All", icon: Users },
                        { key: "batch", label: "Batch", icon: BookOpen },
                        { key: "single", label: "Student", icon: User },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setAudienceScope(opt.key);
                          setSelectedBatchId("");
                          setSelectedStudentId("");
                        }}
                        className={cn(
                          "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all text-center",
                          audienceScope === opt.key
                            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
                            : "border-border/50 text-muted-foreground hover:border-border"
                        )}
                      >
                        <opt.icon className="h-3.5 w-3.5 mx-auto mb-1" />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* batch picker */}
                  {audienceScope === "batch" && (
                    <SelectDropdown
                      value={selectedBatchId}
                      onChange={setSelectedBatchId}
                      placeholder="Select a batch"
                      options={batches.map((b) => ({
                        value: b.id,
                        label: b.name,
                      }))}
                    />
                  )}

                  {/* student picker */}
                  {audienceScope === "single" && (
                    <SelectDropdown
                      value={selectedStudentId}
                      onChange={setSelectedStudentId}
                      placeholder="Select a student"
                      options={students.map((s) => ({
                        value: s.id,
                        label: s.student_name,
                      }))}
                    />
                  )}
                </>
              )}

              {deliveryMode === "group" && (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Select a batch. A generic &quot;Dear Parents&quot; message
                    will be sent to every parent in this batch.
                  </p>
                  <SelectDropdown
                    value={selectedBatchId}
                    onChange={setSelectedBatchId}
                    placeholder="Select a batch"
                    options={batches.map((b) => ({
                      value: b.id,
                      label: b.name,
                    }))}
                  />
                </>
              )}

              {/* recipient count */}
              <div className="rounded-xl bg-background/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Recipients: </span>
                <span className="font-semibold text-foreground">
                  {recipientLabel}
                </span>
                {deliveryMode === "group" && selectedBatchName && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({selectedBatchName})
                  </span>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">
                Preview
              </h3>
              <div className="rounded-xl bg-background/50 p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {getPreview()}
              </div>
              {deliveryMode === "individual" && (
                <p className="text-[10px] text-muted-foreground/60">
                  [Parent] and [Student] will be replaced with actual names
                </p>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-200",
                canSend
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-navy-900 hover:from-cyan-400 hover:to-cyan-300 shadow-lg shadow-cyan-400/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : `Send to ${recipientLabel}`}
            </button>

            {/* Result / Error */}
            {result && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Sent successfully
                </div>
                <p className="text-muted-foreground mt-1">
                  {result.sent} of {result.total} messages delivered
                </p>
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  /* ── preview ────────────────────────────────────────────────────── */

  function getPreview(): string {
    const dateStr = formatDate(form.date);
    const greeting =
      deliveryMode === "group" ? "Dear Parents" : "Hi [Parent]";

    switch (selectedType) {
      case "homework":
        return `${greeting}, homework for ${form.subject || "[Subject]"} (${dateStr}): ${form.message || "[details]"}`;
      case "absent":
        if (deliveryMode === "group") {
          return `${greeting}, attendance was taken today (${dateStr}). Parents of absent students have been notified individually.${form.message ? " " + form.message : ""}`;
        }
        return `${greeting}, [Student] was marked absent from class today (${dateStr}).${form.message ? " " + form.message : ""}`;
      case "test":
        return `${greeting}, upcoming test for ${form.subject || "[Subject]"} on ${dateStr}: ${form.message || "[details]"}`;
      case "timing_change":
        if (form.cancelled) {
          return `${greeting}, class on ${dateStr} has been cancelled.${form.message ? " " + form.message : ""}`;
        }
        return `${greeting}, class timing changed on ${dateStr}. Original: ${form.originalTime || "[time]"}. New time: ${form.newTime || "[time]"}.${form.message ? " " + form.message : ""}`;
      default:
        return "";
    }
  }
}

/* ── Reusable form controls ───────────────────────────────────────── */

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function DarkInput({
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors"
    />
  );
}

function DarkTextarea({
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors resize-none"
    />
  );
}

function SelectDropdown({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
