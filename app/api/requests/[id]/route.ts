import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// PATCH /api/requests/:id -> 관리자 화면에서 처리 상태 변경 (3-5)
// header: x-admin-password
// body: { status: 'pending' | 'in_progress' | 'done' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["pending", "in_progress", "done"].includes(status)) {
    return NextResponse.json({ error: "잘못된 상태 값입니다." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ request: data });
}
