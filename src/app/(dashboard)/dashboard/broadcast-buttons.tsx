"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BroadcastButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleBroadcast(type: "homework" | "absent" | "test") {
    setLoading(type);
    try {
      const res = await fetch("/api/students");
      const students = await res.json();
      const ids = (students || []).map((s: { id: string }) => s.id);

      await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, student_ids: ids }),
      });
      router.refresh();
      window.dispatchEvent(new Event("activity-updated"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Broadcast messages</CardTitle>
        <p className="text-sm text-muted-foreground">
          Send to all students
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleBroadcast("homework")}
          disabled={!!loading}
        >
          {loading === "homework" ? "Sending..." : "Homework reminder"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleBroadcast("absent")}
          disabled={!!loading}
        >
          {loading === "absent" ? "Sending..." : "Absence alert"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleBroadcast("test")}
          disabled={!!loading}
        >
          {loading === "test" ? "Sending..." : "Test announcement"}
        </Button>
      </CardContent>
    </Card>
  );
}
