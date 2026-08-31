import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { sendInquiryNotification } from "@/lib/email";

// GET /api/inquiries -> 전체요청관리 화면의 "문의하기 내역" 목록에서 사용.
// header: x-admin-password (요청 관리 화면과 같은 관리자 비밀번호를 씁니다)
export async function GET(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inquiries: data });
}

// POST /api/inquiries -> 메인 화면 "문의하기" 버튼에서 제출
// body: { name, contact, content }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, contact, content } = body;

  if (!name || !content) {
    return NextResponse.json({ error: "필수 값이 누락되었습니다." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({ name, contact: contact || null, content })
    .select()
    .single();

  if (error || !inquiry) {
    return NextResponse.json({ error: error?.message ?? "문의 등록에 실패했습니다." }, { status: 500 });
  }

  try {
    await sendInquiryNotification({
      name,
      contact: contact || null,
      content,
      createdAt: new Date(inquiry.created_at).toLocaleString("ko-KR"),
    });
  } catch (e) {
    console.error("[email] 문의 알림 발송 실패", e);
  }

  return NextResponse.json({ inquiry });
}
