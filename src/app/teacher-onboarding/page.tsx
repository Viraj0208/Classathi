"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeacherOnboardingPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function checkAndPrefill() {
      const instRes = await fetch("/api/institutes");
      const instData = await instRes.json();
      if (!instData.institute) {
        router.replace("/onboarding");
        return;
      }
      const meRes = await fetch("/api/members/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.name) setName(meData.name);
        if (meData.subject) setSubject(meData.subject);
      }
      setLoadingForm(false);
    }
    checkAndPrefill();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject: subject || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/teacher");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (loadingForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Complete your profile</h1>
          <p className="mt-2 text-muted-foreground">
            Confirm your details to get started
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Your subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Mathematics, Physics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
