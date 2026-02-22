import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] || "";
    });
    rows.push(row);
  }

  return rows;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "CSV file is required" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const rows = parseCSV(text);

  const students = rows
    .filter((r) => {
      const phone = (r.parent_phone || r.parentphone || "").replace(/\D/g, "");
      return r.student_name && r.parent_name && phone.length >= 10;
    })
    .map((r) => {
      const phone = (r.parent_phone || r.parentphone || "").replace(/\D/g, "").slice(-10);
      const fee = parseFloat(r.monthly_fee || r.monthlyfee || "0") || 0;
      const dueDay = Math.min(31, Math.max(1, parseInt(r.fee_due_day || r.feedueday || "1", 10) || 1));
      return {
        institute_id: ctx.instituteId,
        teacher_id: ctx.memberId,
        student_name: r.student_name || r.studentname,
        parent_name: r.parent_name || r.parentname,
        parent_phone: phone,
        monthly_fee: fee,
        fee_due_day: dueDay,
      };
    });

  if (students.length === 0) {
    return NextResponse.json(
      { error: "No valid rows. CSV needs: student_name, parent_name, parent_phone (required). Optional: monthly_fee, fee_due_day" },
      { status: 400 }
    );
  }

  if (students.length > 500) {
    return NextResponse.json(
      { error: "CSV cannot exceed 500 students per upload" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("students")
    .insert(students)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: data?.length ?? 0, students: data });
}
