"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("signup_data");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.instituteName) setName(data.instituteName);
        if (data.name) setOwnerName(data.name);
        sessionStorage.removeItem("signup_data");
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/institutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerName, phone, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-light to-background dark:from-background dark:to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold">
            C
          </div>
          <h1 className="text-3xl font-bold text-primary">
            Set up your institute
          </h1>
          <p className="mt-2 text-muted-foreground">
            A few details to get started
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-md overflow-hidden">
          {/* Blue gradient header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                      {step}
                    </div>
                    {step < 4 && (
                      <div className="h-0.5 w-4 bg-white/20 rounded" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-white/80">
              Fill in your institute details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Institute name</Label>
              <Input
                id="name"
                placeholder="e.g. ABC Tuition Centre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your name</Label>
              <Input
                id="ownerName"
                placeholder="e.g. Ramesh Kumar"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create institute"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
