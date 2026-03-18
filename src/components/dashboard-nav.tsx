"use client";

import { useState } from "react";
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
  Menu,
  X,
  Megaphone,
} from "lucide-react";
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
  const [classesOpen, setClassesOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isClassesActive =
    pathname.startsWith("/students") ||
    pathname.startsWith("/batches") ||
    pathname.startsWith("/attendance");

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const dashboardHref = role === "teacher" ? "/teacher" : "/dashboard";

  const mobileItems = [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Classes", icon: BookOpen, isClasses: true },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/broadcast", label: "Broadcast", icon: Megaphone },
    ...(role === "owner" ? [adminItem] : []),
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border/50 bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 text-navy-900 text-sm font-extrabold shadow-lg shadow-cyan-400/20">
            C
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            Class<span className="text-cyan-400">aathi</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Dashboard */}
          <NavItem
            href={dashboardHref}
            icon={LayoutDashboard}
            label="Dashboard"
            active={isActive(dashboardHref)}
          />

          {/* Classes section */}
          <div>
            <button
              onClick={() => setClassesOpen(!classesOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isClassesActive
                  ? "text-cyan-400"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <BookOpen className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 text-left">Classes</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  classesOpen && "rotate-180"
                )}
              />
            </button>
            {classesOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-border/50 space-y-0.5">
                {classesSubItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Payments */}
          <NavItem
            href="/payments"
            icon={CreditCard}
            label="Payments"
            active={isActive("/payments")}
          />

          {/* Broadcast */}
          <NavItem
            href="/broadcast"
            icon={Megaphone}
            label="Broadcast"
            active={isActive("/broadcast")}
          />

          {/* Admin (owner only) */}
          {role === "owner" && (
            <NavItem
              href={adminItem.href}
              icon={Shield}
              label="Admin"
              active={isActive(adminItem.href)}
            />
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border/50 p-3 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-sidebar-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex md:hidden items-center justify-between h-14 border-b border-border/50 bg-sidebar px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 text-navy-900 text-xs font-extrabold">
            C
          </div>
          <span className="font-bold text-foreground">
            Class<span className="text-cyan-400">aathi</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border/50 md:hidden flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 text-navy-900 text-xs font-extrabold">
                C
              </div>
              <span className="font-bold text-foreground">
                Class<span className="text-cyan-400">aathi</span>
              </span>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {mobileItems.map((item) => {
                const active =
                  "isClasses" in item && item.isClasses
                    ? isClassesActive
                    : isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-cyan-400/10 text-cyan-400"
                        : "text-sidebar-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border/50 p-3">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-sidebar/95 backdrop-blur md:hidden">
        <div className="flex justify-around py-1.5">
          {mobileItems.map((item) => {
            const active =
              "isClasses" in item && item.isClasses
                ? isClassesActive
                : isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors rounded-lg",
                  active
                    ? "text-cyan-400"
                    : "text-sidebar-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {active && (
                  <span className="h-0.5 w-5 rounded-full bg-cyan-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* Sidebar nav item */
function NavItem({
  href,
  icon: Icon,
  label,
  active,
  compact,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
        compact ? "px-3 py-2" : "px-3 py-2.5",
        active
          ? "bg-cyan-400/10 text-cyan-400 shadow-sm shadow-cyan-400/5"
          : "text-sidebar-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Icon className={cn("shrink-0", compact ? "h-4 w-4" : "h-[18px] w-[18px]")} />
      {label}
    </Link>
  );
}
