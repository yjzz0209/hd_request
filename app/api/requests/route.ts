import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { sendRequestNotification } from "@/lib/email";
import { targetTeamFor } from "@/lib/requestTypes";

// GET /api/requests?team=marketing  -> 조회 화면에서 사용 (3-4)
export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("requests")
    .select(
      "id, request_no, team_id, target_team_id, requester_name, request_type, status, created_at, completed_at, erp_doc_no"
    )
    .order("created_at", { ascending: false });

  if (team) {
    query = query.eq("team_id", team);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ requests: data });
}

// POST /api/requests -> 요청 제출 처리 (3-3)
// body: { teamId, requesterName, requestType, detail: {...}, summary }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { teamId, requesterName, requestType, detail, summary, erpDocNo } = body;

  if (!teamId || !requesterName || !requestType || !detail) {
    return NextResponse.json({ error: "필수 값이 누락되었습니다." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // 1) 공통 정보 저장
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .insert({
      team_id: teamId,
      target_team_id: targetTeamFor(requestType),
      requester_name: requesterName,
      request_type: requestType,
      erp_doc_no: erpDocNo || null,
    })
    .select()
    .single();

  if (requestError || !request) {
    return NextResponse.json(
      { error: requestError?.message ?? "요청 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  // 2) 유형별 상세 테이블 저장
  const detailError = await saveDetail(supabase, request.id, requestType, detail);
  if (detailError) {
    // 상세 저장 실패 시 공통 레코드도 롤백
    await supabase.from("requests").delete().eq("id", request.id);
    return NextResponse.json({ error: detailError }, { status: 500 });
  }

  // 3) 이메일 알림 (Resend). 이 메일을 Power Automate가 감지해서 엑셀에 반영합니다.
  try {
    await sendRequestNotification({
      requestNo: request.request_no,
      teamId,
      requesterName,
      requestType,
      createdAt: new Date(request.created_at).toLocaleString("ko-KR"),
      summary: summary ?? "",
      erpDocNo: erpDocNo || null,
      detail,
    });
  } catch (e) {
    console.error("[email] 알림 발송 실패", e);
    // 이메일 실패는 요청 등록 자체를 막지 않습니다.
  }

  return NextResponse.json({ request });
}

async function saveDetail(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  requestId: number,
  requestType: string,
  detail: any
): Promise<string | null> {
  switch (requestType) {
    case "new_product": {
      const { pricing_tiers, images, ...rest } = detail;
      const { error } = await supabase
        .from("request_new_product")
        .insert({ request_id: requestId, ...rest });
      if (error) return error.message;

      if (Array.isArray(pricing_tiers) && pricing_tiers.length > 0) {
        const rows = pricing_tiers.map((t: any) => ({ ...t, request_id: requestId }));
        const { error: tierError } = await supabase.from("pricing_tiers").insert(rows);
        if (tierError) return tierError.message;
      }

      if (Array.isArray(images) && images.length > 0) {
        const rows = images.map((i: any) => ({ ...i, request_id: requestId }));
        const { error: imgError } = await supabase.from("product_images").insert(rows);
        if (imgError) return imgError.message;
      }
      return null;
    }

    case "product_change": {
      const { items } = detail;
      if (!Array.isArray(items) || items.length === 0) {
        return "변경할 항목을 1개 이상 입력해주세요.";
      }
      const rows = items.map((i: any) => ({ ...i, request_id: requestId }));
      const { error } = await supabase.from("product_change_items").insert(rows);
      return error?.message ?? null;
    }

    case "popup": {
      const { error } = await supabase
        .from("request_popup")
        .insert({ request_id: requestId, ...detail });
      return error?.message ?? null;
    }

    case "banner": {
      const { error } = await supabase
        .from("request_banner")
        .insert({ request_id: requestId, ...detail });
      return error?.message ?? null;
    }

    case "package": {
      const { items, images, ...rest } = detail;
      const { error } = await supabase
        .from("request_package")
        .insert({ request_id: requestId, ...rest });
      if (error) return error.message;

      if (Array.isArray(items) && items.length > 0) {
        const rows = items.map((i: any) => ({ ...i, request_id: requestId }));
        const { error: itemError } = await supabase.from("package_items").insert(rows);
        if (itemError) return itemError.message;
      }

      if (Array.isArray(images) && images.length > 0) {
        const rows = images.map((i: any) => ({ ...i, request_id: requestId }));
        const { error: imgError } = await supabase.from("product_images").insert(rows);
        if (imgError) return imgError.message;
      }
      return null;
    }

    case "etc": {
      const { error } = await supabase
        .from("request_etc")
        .insert({ request_id: requestId, content: detail.content });
      return error?.message ?? null;
    }

    case "order_cancel": {
      const { items, reason } = detail;
      const { error } = await supabase
        .from("request_order_cancel")
        .insert({ request_id: requestId, reason });
      if (error) return error.message;

      if (Array.isArray(items) && items.length > 0) {
        const rows = items.map((i: any) => ({ ...i, request_id: requestId }));
        const { error: itemError } = await supabase.from("order_cancel_items").insert(rows);
        if (itemError) return itemError.message;
      }
      return null;
    }

    case "pharmacy_info_change": {
      const { items, ...rest } = detail;
      if (!Array.isArray(items) || items.length === 0) {
        return "변경할 항목을 1개 이상 입력해주세요.";
      }
      const { error } = await supabase
        .from("request_pharmacy_info_change")
        .insert({ request_id: requestId, ...rest });
      if (error) return error.message;

      const rows = items.map((i: any) => ({ ...i, request_id: requestId }));
      const { error: itemError } = await supabase.from("pharmacy_info_change_items").insert(rows);
      if (itemError) return itemError.message;
      return null;
    }

    case "exception_order_shipment": {
      const { items } = detail;
      if (!Array.isArray(items) || items.length === 0) {
        return "출고 요청 항목을 1개 이상 입력해주세요.";
      }
      const rows = items.map((i: any) => ({ ...i, request_id: requestId }));
      const { error } = await supabase.from("exception_order_shipment_items").insert(rows);
      return error?.message ?? null;
    }

    case "holiday_setting": {
      const { error } = await supabase
        .from("request_holiday_setting")
        .insert({ request_id: requestId, ...detail });
      return error?.message ?? null;
    }

    case "soldout_processing": {
      const { items } = detail;
      if (!Array.isArray(items) || items.length === 0) {
        return "품절 처리할 품목을 1개 이상 입력해주세요.";
      }
      const rows = items.map((i: any) => ({ ...i, request_id: requestId }));
      const { error } = await supabase.from("soldout_items").insert(rows);
      return error?.message ?? null;
    }

    case "popup_takedown": {
      const { error } = await supabase
        .from("request_popup_takedown")
        .insert({ request_id: requestId, ...detail });
      return error?.message ?? null;
    }

    default:
      return `알 수 없는 요청 유형입니다: ${requestType}`;
  }
}
