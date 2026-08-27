import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { loadDetailForRequest } from "@/lib/requestDetail";

// GET /api/requests/:id -> 요청 조회 화면에서 상세 내역을 펼쳐볼 때 사용
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single();

  if (requestError || !request) {
    return NextResponse.json({ error: requestError?.message ?? "요청을 찾을 수 없습니다." }, { status: 404 });
  }

  const detail = await loadDetailForRequest(supabase, request.id, request.request_type);

  return NextResponse.json({ request, detail });
}

// PATCH /api/requests/:id -> 관리자 화면에서 처리 상태 변경 (3-5)
// header: x-admin-password
// body: { status: 'pending' | 'in_progress' | 'done' | 'rejected' }
// 상태가 '완료' 또는 '반려'가 되면(둘 다 요청이 끝난 상태이므로) completed_at에 그 시각을
// 함께 기록하고, 대기/처리중으로 되돌리면 completed_at도 비웁니다. 화면에는 상태에 따라
// "완료일시" 또는 "반려일시"로 구분해서 보여줍니다.
const END_STATUSES = ["done", "rejected"];

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

  if (!["pending", "in_progress", "done", "rejected"].includes(status)) {
    return NextResponse.json({ error: "잘못된 상태 값입니다." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .update({ status, completed_at: END_STATUSES.includes(status) ? new Date().toISOString() : null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ request: data });
}
