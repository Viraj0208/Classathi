import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: institute } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .single();

  if (!institute) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="font-bold text-primary text-lg">
            Classathi
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/students">
              <Button variant="ghost" size="sm">
                Students
              </Button>
            </Link>
            <Link href="/payments">
              <Button variant="ghost" size="sm">
                Payments
              </Button>
            </Link>
            <form action="/api/auth/logout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden safe-area-pb">
        <div className="flex justify-around py-3">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/students"
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Students
          </Link>
          <Link
            href="/payments"
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Payments
          </Link>
        </div>
      </nav>
    </div>
  );
}
