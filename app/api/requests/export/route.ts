import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { loadDetailForRequest } from "@/lib/requestDetail";
import { REQUEST_TYPES, STATUS_LABEL, teamName, typeLabel } from "@/lib/requestTypes";

// GET /api/requests/export -> 전체요청관리 화면의 "엑셀 다운로드" 버튼에서 사용.
// header: x-admin-password
//
// "전체" 시트에는 요청마다 공통 항목만 한 줄씩, 요청 유형별 시트에는 그 유형의 상세 항목을
// 전부 컬럼으로 펼쳐서 담습니다. 변경 항목/주문 목록처럼 한 요청 안에 여러 건이 들어갈 수
// 있는 항목은 건별로 행을 나눠서 담고(공통 항목은 각 행에 반복), 이미지는 셀에 직접 넣지 않고
// 저장된 파일의 링크(URL) 텍스트만 넣습니다.

function commonCols(r: any) {
  return {
    요청번호: r.request_no,
    "보낸 팀": teamName(r.team_id),
    "받는 팀": teamName(r.target_team_id),
    담당자: r.requester_name,
    상태: STATUS_LABEL[r.status] ?? r.status,
    등록일시: r.created_at ? new Date(r.created_at).toLocaleString("ko-KR") : "",
    종료일시: r.completed_at ? new Date(r.completed_at).toLocaleString("ko-KR") : "",
    "전자결재 문서번호": r.erp_doc_no ?? "",
  };
}

function rowsFor(requestType: string, r: any, detail: any): Record<string, any>[] {
  const base = commonCols(r);
  if (!detail) return [base];

  switch (requestType) {
    case "new_product":
    case "package": {
      const isPackage = requestType === "package";
      const tiers = (detail.pricing_tiers ?? [])
        .map((t: any) => `최소수량 ${t.min_qty} / 등급 ${t.grade} / 가격 ${t.price}`)
        .join("; ");
      const packageItems = (detail.items ?? [])
        .map((i: any) => `상품코드 ${i.product_code} / 수량 ${i.qty} / 배분금액 ${i.allocated_price}`)
        .join("; ");
      const images = (detail.images ?? []).map((i: any) => `${i.image_type}: ${i.file_url}`).join("; ");
      return [
        {
          ...base,
          ...(isPackage ? {} : { "자체 상품코드": detail.product_code }),
          상품명: detail.product_name,
          "과세 여부": detail.is_taxable ? "과세" : "면세",
          "판매 재고 유형": detail.stock_type === "by_stock" ? "재고량에 따름" : "무한정 판매",
          "상품 재고": detail.stock_type === "by_stock" ? detail.stock_qty : "",
          "묶음 주문 단위": detail.bundle_unit,
          판매기간: detail.sale_period_type === "fixed" ? "기간 있음" : "제한없음",
          "판매 기간":
            detail.sale_period_type === "fixed"
              ? `${detail.sale_start_date ?? ""} ~ ${detail.sale_end_date ?? ""}`
              : "",
          "금융비 사용 설정": detail.use_finance_fee ? "예" : "아니오",
          ...(isPackage ? { "할인 판매 총액": detail.total_price } : {}),
          "상품 상세 설명 문구": detail.description_file_url ?? "",
          ...(isPackage ? { "패키지 구성품": packageItems } : { "수량/등급별 가격 세팅": tiers }),
          "개별 이미지": images,
        },
      ];
    }

    case "product_change": {
      const items = detail.items ?? [];
      if (items.length === 0) return [base];
      return items.map((i: any) => ({
        ...base,
        상품코드: i.target_product_code,
        "변경 항목": i.field_name,
        "기존 값": i.old_value,
        "변경될 값": i.new_value,
      }));
    }

    case "popup":
      return [
        {
          ...base,
          "노출 위치": [detail.expose_pc && "PC", detail.expose_mobile && "모바일"].filter(Boolean).join(", "),
          "팝업 제목": detail.title,
          "노출 방식": detail.expose_type,
          "노출 기간": detail.start_at ? `${detail.start_at} ~ ${detail.end_at ?? ""}` : "항상 노출",
          "오늘 하루 보지 않음": detail.hide_today_option ? "예" : "아니오",
          이미지: detail.image_url ?? "",
          "이동 링크": detail.link_url ?? "",
        },
      ];

    case "banner":
      return [
        {
          ...base,
          "배너 위치": detail.banner_type,
          "배너 제목": detail.title,
          이미지: detail.image_url ?? "",
          "이동 링크": detail.link_url ?? "",
        },
      ];

    case "etc":
      return [{ ...base, 내용: detail.content }];

    case "order_cancel": {
      const items = detail.items ?? [];
      if (items.length === 0) return [{ ...base, "취소 사유": detail.reason }];
      return items.map((i: any) => ({
        ...base,
        "취소 사유": detail.reason,
        주문번호: i.order_no,
        거래처코드: i.vendor_code,
        거래처명: i.vendor_name,
        품목번호: i.item_no,
        품목명: i.item_name,
        수량: i.qty,
      }));
    }

    case "pharmacy_info_change": {
      const items = detail.items ?? [];
      const parent = {
        ...base,
        약국명: detail.pharmacy_name,
        약사명: detail.pharmacist_name,
        거래처코드: detail.vendor_code,
        사업자등록증: detail.business_reg_file_url ?? "",
      };
      if (items.length === 0) return [parent];
      return items.map((i: any) => ({
        ...parent,
        "변경 항목": i.field_name,
        "기존 값": i.old_value,
        "변경될 값": i.new_value,
      }));
    }

    case "exception_order_shipment": {
      const items = detail.items ?? [];
      if (items.length === 0) return [base];
      return items.map((i: any) => ({
        ...base,
        주문번호: i.order_no,
        품목명: i.item_name,
        품목코드: i.item_code,
        출고수량: i.qty,
      }));
    }

    case "holiday_setting":
      return [
        {
          ...base,
          "휴무 시작일": detail.holiday_start_date,
          "휴무 종료일": detail.holiday_end_date ?? "",
          "주문 마감 일시": detail.order_cutoff_at,
          "출고 재개일": detail.shipment_resume_date,
        },
      ];

    case "soldout_processing": {
      const items = detail.items ?? [];
      if (items.length === 0) return [base];
      return items.map((i: any) => ({
        ...base,
        품목명: i.item_name,
        품목코드: i.item_code,
        "품절 노출 기간": i.period_type === "period" ? `${i.start_date ?? ""} ~ ${i.end_date ?? ""}` : "기간 없음",
      }));
    }

    case "popup_takedown":
      return [
        {
          ...base,
          팝업명: detail.popup_name,
          "내리는 사유": detail.reason ?? "",
          "희망 내리기 일시": detail.desired_takedown_at ?? "",
        },
      ];

    case "notice":
      return [
        {
          ...base,
          "공지 제목": detail.title,
          "공지 게시 기간": `${detail.start_date ?? ""} ~ ${detail.end_date ?? ""}`,
          "공지 내용": detail.content ?? "",
        },
      ];

    default:
      return [base];
  }
}

// 엑셀 시트 이름은 31자 제한 + 일부 특수문자를 쓸 수 없어 안전하게 다듬습니다.
function safeSheetName(name: string) {
  return name.replace(/[\\/*?:[\]]/g, "").slice(0, 31);
}

export async function GET(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const { data: requests, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "업무협조요청시스템";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("전체");
  const summaryRows = (requests ?? []).map((r) => ({ ...commonCols(r), 요청유형: typeLabel(r.request_type) }));
  if (summaryRows.length > 0) {
    summarySheet.columns = Object.keys(summaryRows[0]).map((key) => ({ header: key, key, width: 20 }));
    summarySheet.addRows(summaryRows);
  } else {
    summarySheet.columns = [{ header: "안내", key: "note", width: 40 }];
    summarySheet.addRow({ note: "등록된 요청이 없습니다." });
  }
  summarySheet.getRow(1).font = { bold: true };

  for (const type of REQUEST_TYPES) {
    const typedRequests = (requests ?? []).filter((r) => r.request_type === type.id);
    if (typedRequests.length === 0) continue;

    const rows: Record<string, any>[] = [];
    for (const r of typedRequests) {
      const detail = await loadDetailForRequest(supabase, r.id, r.request_type);
      rows.push(...rowsFor(r.request_type, r, detail));
    }
    if (rows.length === 0) continue;

    const sheet = workbook.addWorksheet(safeSheetName(type.label));
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 22 }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hd_requests_${today}.xlsx"`,
    },
  });
}
