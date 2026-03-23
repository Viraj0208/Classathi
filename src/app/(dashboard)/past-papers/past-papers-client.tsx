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
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";

type Paper = {
  id: string;
  title: string;
  subject: string | null;
  file_url: string;
  file_type: "pdf" | "image";
  file_size: number | null;
  uploaded_by: string;
  uploaded_by_member: { name: string } | null;
  created_at: string;
};

type Props = {
  papers: Paper[];
  role: string;
  currentMemberId: string;
};

export default function PastPapersClient({ papers, role, currentMemberId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function handleClose() {
    setOpen(false);
    setError("");
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("title", (new FormData(form).get("title") as string) || "");
    fd.append("subject", (new FormData(form).get("subject") as string) || "");

    try {
      const res = await fetch("/api/past-papers", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      handleClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this paper? This cannot be undone.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/past-papers/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } finally {
      setDeleting(null);
    }
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const canDelete = (paper: Paper) =>
    role === "owner" || paper.uploaded_by === currentMemberId;

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        Upload Paper
      </Button>

      {/* Papers grid */}
      {papers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="group rounded-xl border bg-card p-4 space-y-3 transition-shadow hover:shadow-md"
            >
              {/* File type icon + title */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    paper.file_type === "pdf"
                      ? "bg-red-400/10 text-red-500"
                      : "bg-blue-400/10 text-blue-500"
                  }`}
                >
                  {paper.file_type === "pdf" ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{paper.title}</h4>
                  {paper.subject && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {paper.subject}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  By {paper.uploaded_by_member?.name ?? "Unknown"} &middot;{" "}
                  {formatDate(paper.created_at)}
                </p>
                {paper.file_size && (
                  <p>{formatSize(paper.file_size)} &middot; {paper.file_type.toUpperCase()}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View
                  </Button>
                </a>
                {canDelete(paper) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(paper.id)}
                    disabled={deleting === paper.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deleting === paper.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" onClose={handleClose}>
          <DialogHeader>
            <DialogTitle>Upload Past Paper</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Maths Final Exam 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label>File (PDF or Image, max 10MB)</Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                    file:text-sm file:font-medium file:bg-primary/10 file:text-primary
                    hover:file:bg-primary/20 file:cursor-pointer cursor-pointer
                    rounded-lg border bg-background px-3 py-2"
                />
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {selectedFile.type === "application/pdf" ? (
                    <FileText className="w-4 h-4 text-red-500" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="shrink-0">({formatSize(selectedFile.size)})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {previewUrl && (
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 w-full object-contain bg-muted/30"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !selectedFile}
              >
                {loading ? "Uploading..." : "Upload Paper"}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
