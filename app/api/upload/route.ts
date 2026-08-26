import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// POST /api/upload (multipart/form-data, field name: file / title / label)
// Supabase Storage에 원본 파일 그대로 업로드하고 공개 URL을 돌려줍니다.
// 엑셀 셀에 이미지를 직접 넣지 않고, 스토리지 폴더에 파일로 보관한 뒤
// 엑셀/이메일에는 링크만 남기는 방식이라, 파일명만 보고도 어떤 요청의
// 무슨 이미지인지 알 수 있도록 "요청날짜_요청제목_이미지명" 형태로 저장합니다.
// 첨부파일 정책(오픈 이슈 6-4): 파일당 20MB 이내, 보관 기간 제한 없음
const MAX_SIZE = 20 * 1024 * 1024;

function sanitize(part: string) {
  return part
    .trim()
    .replace(/[\\/:*?"<>|]/g, "") // 파일 경로에 쓸 수 없는 문자 제거
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

function todayStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null) ?? "제목미정";
  const label = (formData.get("label") as string | null) ?? "첨부파일";

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일은 20MB 이내여야 합니다." }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "request-uploads";
  const supabase = getSupabaseServerClient();

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const uniqueSuffix = crypto.randomUUID().slice(0, 8);
  const baseName = [todayStamp(), sanitize(title), sanitize(label)].filter(Boolean).join("_");
  const path = `uploads/${baseName}_${uniqueSuffix}${ext ? "." + ext : ""}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl.publicUrl, name: file.name });
}
