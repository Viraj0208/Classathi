import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";

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

  const { data: member } = await supabase
    .from("institute_members")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav role={member.role} />
      <main className="md:ml-60 min-h-screen px-4 py-6 pb-24 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
