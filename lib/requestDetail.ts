import { getSupabaseServerClient } from "@/lib/supabaseServer";

// 요청 유형별 상세 테이블을 읽어옵니다. 요청 조회/전체요청관리 화면의 상세 펼치기,
// 알림 이메일, 엑셀 다운로드가 모두 이 함수를 공유해서 씁니다.
export async function loadDetailForRequest(
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
