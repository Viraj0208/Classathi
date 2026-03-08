"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RemoveTeacherButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    if (!confirm(`Remove ${memberName} from the institute?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      {loading ? "Removing..." : "Remove"}
    </Button>
  );
}
