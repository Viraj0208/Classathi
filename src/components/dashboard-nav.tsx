"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CreditCard,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const classesSubItems = [
  { href: "/students", label: "Students", icon: Users },
  { href: "/batches", label: "Batches", icon: BookOpen },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
];

const adminItem = { href: "/admin/teachers", label: "Admin", icon: Shield };

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname();
  const [classesOpen, setClassesOpen] = useState(false);

  const isClassesActive =
    pathname.startsWith("/students") ||
    pathname.startsWith("/batches") ||
    pathname.startsWith("/attendance");

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-classes-dropdown]")) {
        setClassesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const dashboardHref = role === "teacher" ? "/teacher" : "/dashboard";

  // Mobile nav items
  const mobileItems = [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Classes", icon: BookOpen, isClasses: true },
    { href: "/payments", label: "Payments", icon: CreditCard },
    ...(role === "owner" ? [adminItem] : []),
  ];

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-primary text-lg"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              C
            </div>
            Classathi
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {/* Dashboard link */}
            <Link href={dashboardHref}>
              <Button
                variant={isActive(dashboardHref) ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 transition-colors",
                  isActive(dashboardHref) &&
                    "text-primary font-semibold bg-primary-light dark:bg-primary/10"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            {/* Classes dropdown */}
            <div className="relative" data-classes-dropdown>
              <button
                onClick={() => setClassesOpen(!classesOpen)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isClassesActive
                    ? "text-primary font-semibold bg-primary-light dark:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-slate-700"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Classes
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform",
                    classesOpen && "rotate-180"
                  )}
                />
              </button>

              {classesOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border bg-white dark:bg-slate-800 shadow-lg z-50 py-1">
                  {classesSubItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setClassesOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "text-primary font-medium bg-blue-50 dark:bg-slate-700"
                          : "text-foreground hover:bg-blue-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Payments link */}
            <Link href="/payments">
              <Button
                variant={isActive("/payments") ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 transition-colors",
                  isActive("/payments") &&
                    "text-primary font-semibold bg-primary-light dark:bg-primary/10"
                )}
              >
                <CreditCard className="h-4 w-4" />
                Payments
              </Button>
            </Link>

            {/* Admin link (owner only) */}
            {role === "owner" && (
              <Link href={adminItem.href}>
                <Button
                  variant={isActive(adminItem.href) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-colors",
                    isActive(adminItem.href) &&
                      "text-primary font-semibold bg-primary-light dark:bg-primary/10"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden safe-area-pb">
        <div className="flex justify-around py-2">
          {mobileItems.map((item) => {
            const active = "isClasses" in item && item.isClasses
              ? isClassesActive
              : isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {active && (
                  <span className="h-1 w-6 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
