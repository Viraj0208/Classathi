"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SendRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/reminders/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult({ sent: data.sent, total: data.total });
        router.refresh();
        window.dispatchEvent(new Event("activity-updated"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Fee reminders</CardTitle>
        <p className="text-sm text-muted-foreground">
          Send WhatsApp reminders with payment links to unpaid students
        </p>
      </CardHeader>
      <CardContent>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send fee reminders"}
        </Button>
        {result && (
          <p className="mt-3 text-sm text-muted-foreground">
            Sent {result.sent} of {result.total} reminders
          </p>
        )}
      </CardContent>
    </Card>
  );
}
