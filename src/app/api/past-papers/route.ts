import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/auth-context";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export async function GET() {
  const supabase = await createClient();

  let ctx;
  try {
    ctx = await getMemberContext(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("past_papers")
    .select("*, uploaded_by_member:institute_members!uploaded_by(name)")
    .eq("institute_id", ctx.instituteId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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
  const title = formData.get("title") as string | null;
  const subject = formData.get("subject") as string | null;

  if (!file || !title) {
    return NextResponse.json(
      { error: "Title and file are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF and image files (JPEG, PNG, WebP) are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size must be under 10MB" },
      { status: 400 }
    );
  }

  const fileType = file.type === "application/pdf" ? "pdf" : "image";
  const ext = file.name.split(".").pop() || (fileType === "pdf" ? "pdf" : "jpg");
  const fileName = `${ctx.instituteId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("past-papers")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Failed to upload file: " + uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("past-papers")
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("past_papers")
    .insert({
      institute_id: ctx.instituteId,
      uploaded_by: ctx.memberId,
      title: title.trim(),
      subject: subject?.trim() || null,
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size: file.size,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
