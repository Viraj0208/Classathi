"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

async function fetchActivities() {
  const r = await fetch("/api/activity/recent");
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchActivities().then(setActivities).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("activity-updated", handler);
    return () => window.removeEventListener("activity-updated", handler);
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !activities.length ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground shrink-0">
                  {formatTime(a.created_at)}
                </span>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
