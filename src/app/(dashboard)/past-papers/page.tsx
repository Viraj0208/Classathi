import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberContext } from "@/lib/auth-context";
import { FileText } from "lucide-react";
import PastPapersClient from "./past-papers-client";

export default async function PastPapersPage() {
  const supabase = await createClient();
  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return null;
  }

  const { data: papers } = await supabase
    .from("past_papers")
    .select("*, uploaded_by_member:institute_members!uploaded_by(name)")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Past Papers</h1>
        <p className="text-muted-foreground">
          Upload and manage old exam papers for students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All papers ({papers?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!papers?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light dark:bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No papers yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Upload your first past paper — PDFs or photos of old exams.
              </p>
              <div className="mt-4">
                <PastPapersClient papers={[]} role={ctx.role} currentMemberId={ctx.memberId} />
              </div>
            </div>
          ) : (
            <PastPapersClient
              papers={papers}
              role={ctx.role}
              currentMemberId={ctx.memberId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
