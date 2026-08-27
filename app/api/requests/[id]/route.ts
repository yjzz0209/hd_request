import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

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

  const detail = await loadDetail(supabase, request.id, request.request_type);

  return NextResponse.json({ request, detail });
}

async function loadDetail(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  requestId: number,
  requestType: string
): Promise<any> {
  switch (requestType) {
    case "new_product": {
      const [{ data: main }, { data: pricingTiers }, { data: images }] = await Promise.all([
        supabase.from("request_new_product").select("*").eq("request_id", requestId).single(),
        supabase.from("pricing_tiers").select("*").eq("request_id", requestId),
        supabase.from("product_images").select("*").eq("request_id", requestId),
      ]);
      return { ...main, pricing_tiers: pricingTiers ?? [], images: images ?? [] };
    }

    case "product_change": {
      const { data: items } = await supabase
        .from("product_change_items")
        .select("*")
        .eq("request_id", requestId);
      return { items: items ?? [] };
    }

    case "popup": {
      const { data } = await supabase.from("request_popup").select("*").eq("request_id", requestId).single();
      return data;
    }

    case "banner": {
      const { data } = await supabase.from("request_banner").select("*").eq("request_id", requestId).single();
      return data;
    }

    case "package": {
      const [{ data: main }, { data: items }, { data: images }] = await Promise.all([
        supabase.from("request_package").select("*").eq("request_id", requestId).single(),
        supabase.from("package_items").select("*").eq("request_id", requestId),
        supabase.from("product_images").select("*").eq("request_id", requestId),
      ]);
      return { ...main, items: items ?? [], images: images ?? [] };
    }

    case "etc": {
      const { data } = await supabase.from("request_etc").select("*").eq("request_id", requestId).single();
      return data;
    }

    case "order_cancel": {
      const [{ data: main }, { data: items }] = await Promise.all([
        supabase.from("request_order_cancel").select("*").eq("request_id", requestId).single(),
        supabase.from("order_cancel_items").select("*").eq("request_id", requestId),
      ]);
      return { ...main, items: items ?? [] };
    }

    case "pharmacy_info_change": {
      const [{ data: main }, { data: items }] = await Promise.all([
        supabase.from("request_pharmacy_info_change").select("*").eq("request_id", requestId).single(),
        supabase.from("pharmacy_info_change_items").select("*").eq("request_id", requestId),
      ]);
      return { ...main, items: items ?? [] };
    }

    case "exception_order_shipment": {
      const { data: items } = await supabase
        .from("exception_order_shipment_items")
        .select("*")
        .eq("request_id", requestId);
      return { items: items ?? [] };
    }

    case "holiday_setting": {
      const { data } = await supabase
        .from("request_holiday_setting")
        .select("*")
        .eq("request_id", requestId)
        .single();
      return data;
    }

    case "soldout_processing": {
      const { data: items } = await supabase
        .from("soldout_items")
        .select("*")
        .eq("request_id", requestId);
      return { items: items ?? [] };
    }

    case "popup_takedown": {
      const { data } = await supabase
        .from("request_popup_takedown")
        .select("*")
        .eq("request_id", requestId)
        .single();
      return data;
    }

    default:
      return null;
  }
}

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
