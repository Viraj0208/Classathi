import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csv =
    "student_name,parent_name,parent_phone,monthly_fee,fee_due_day\n" +
    "Rahul Kumar,Parent Name,9876543210,2000,5\n" +
    "Priya Sharma,Mother Name,9123456789,2500,1";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="students_template.csv"',
    },
  });
}
