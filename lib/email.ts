import { Resend } from "resend";
import { teamName, typeLabel } from "./requestTypes";

// Power Automate가 Outlook 트리거로 이 이메일을 감지해서
// SharePoint/OneDrive의 엑셀 파일에 한 행씩 옮겨 적습니다.
// 그래서 아래 표 형식(라벨: 값)을 절대 임의로 바꾸면 안 되고,
// 바꿔야 한다면 Power Automate 흐름의 파싱 로직도 함께 수정해야 합니다.
//
// 이미지 파일은 셀에 직접 넣지 않고(스토리지 폴더에 파일로만 저장),
// 이미지가 저장된 위치를 알 수 있도록 링크(URL) 텍스트만 값으로 넣습니다.

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function row(label: string, value: unknown) {
  const v = escapeHtml(value);
  return `<tr><td><b>${escapeHtml(label)}</b></td><td>${v || "-"}</td></tr>`;
}

function fileLinkValue(url?: string | null) {
  if (!url) return "";
  const safe = escapeHtml(url);
  return `<a href="${safe}">${safe}</a>`;
}

function itemsTable(items: any[] | undefined, columns: { key: string; label: string }[]) {
  if (!Array.isArray(items) || items.length === 0) return "(없음)";
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body = items
    .map(
      (it) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(it[c.key])}</td>`).join("")}</tr>`
    )
    .join("");
  return `<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;"><tr>${head}</tr>${body}</table>`;
}

const YES_NO = (v: boolean) => (v ? "예" : "아니오");
const STOCK_TYPE = (v: string) => (v === "by_stock" ? "재고량에 따름" : "무한정 판매");
const SALE_PERIOD = (v: string) => (v === "fixed" ? "기간 있음" : "제한없음");

// 요청 유형별 상세 항목을 라벨:값 행으로 펼쳐줍니다. (요청 조회 화면의 RequestDetail과 동일한 항목 기준)
function buildDetailRows(requestType: string, detail: any): string {
  if (!detail) return "";

  switch (requestType) {
    case "new_product":
    case "package": {
      const isPackage = requestType === "package";
      const rows = [
        !isPackage && row("자체 상품코드", detail.product_code),
        row("상품명", detail.product_name),
        row("과세 여부", detail.is_taxable ? "과세" : "면세"),
        row("판매 재고 유형", STOCK_TYPE(detail.stock_type)),
        detail.stock_type === "by_stock" && row("상품 재고", detail.stock_qty),
        row("묶음 주문 단위", detail.bundle_unit),
        row("판매기간", SALE_PERIOD(detail.sale_period_type)),
        detail.sale_period_type === "fixed" &&
          row("판매 기간", `${detail.sale_start_date ?? ""} ~ ${detail.sale_end_date ?? ""}`),
        row("금융비 사용 설정", YES_NO(detail.use_finance_fee)),
        isPackage && row("할인 판매 총액", detail.total_price),
        row("상품 상세 설명 문구", fileLinkValue(detail.description_file_url)),
        !isPackage &&
          row(
            "수량/등급별 가격 세팅",
            itemsTable(detail.pricing_tiers, [
              { key: "min_qty", label: "최소 수량" },
              { key: "grade", label: "등급" },
              { key: "price", label: "가격" },
            ])
          ),
        isPackage &&
          row(
            "패키지 구성품",
            itemsTable(detail.items, [
              { key: "product_code", label: "상품코드" },
              { key: "qty", label: "수량" },
              { key: "allocated_price", label: "배분 금액" },
            ])
          ),
        row(
          "개별 이미지",
          (detail.images ?? [])
            .map((img: any) => `${escapeHtml(img.image_type)}: ${fileLinkValue(img.file_url)}`)
            .join("<br/>") || "(없음)"
        ),
      ];
      return rows.filter(Boolean).join("");
    }

    case "product_change":
      return row(
        "변경 항목",
        itemsTable(detail.items, [
          { key: "target_product_code", label: "상품코드" },
          { key: "field_name", label: "변경 항목" },
          { key: "old_value", label: "기존 값" },
          { key: "new_value", label: "변경될 값" },
        ])
      );

    case "popup":
      return [
        row("노출 위치", [detail.expose_pc && "PC", detail.expose_mobile && "모바일"].filter(Boolean).join(", ")),
        row("팝업 제목", detail.title),
        row("노출 방식", detail.expose_type),
        row("노출 기간", detail.start_at ? `${detail.start_at} ~ ${detail.end_at ?? ""}` : "항상 노출"),
        row("오늘 하루 보지 않음", YES_NO(detail.hide_today_option)),
        row("이미지", fileLinkValue(detail.image_url)),
        row("이동 링크", detail.link_url),
      ].join("");

    case "banner":
      return [
        row("배너 위치", detail.banner_type),
        row("배너 제목", detail.title),
        row("이미지", fileLinkValue(detail.image_url)),
        row("이동 링크", detail.link_url),
      ].join("");

    case "etc":
      return row("내용", detail.content);

    case "order_cancel":
      return [
        row("취소 사유", detail.reason),
        row(
          "취소 대상 주문",
          itemsTable(detail.items, [
            { key: "order_no", label: "주문번호" },
            { key: "vendor_code", label: "거래처코드" },
            { key: "vendor_name", label: "거래처명" },
            { key: "item_no", label: "품목번호" },
            { key: "item_name", label: "품목명" },
            { key: "qty", label: "수량" },
          ])
        ),
      ].join("");

    case "pharmacy_info_change":
      return [
        row("약국명", detail.pharmacy_name),
        row("약사명", detail.pharmacist_name),
        row("거래처코드", detail.vendor_code),
        row("사업자등록증", fileLinkValue(detail.business_reg_file_url)),
        row(
          "변경 항목",
          itemsTable(detail.items, [
            { key: "field_name", label: "변경 항목" },
            { key: "old_value", label: "기존 값" },
            { key: "new_value", label: "변경될 값" },
          ])
        ),
      ].join("");

    case "exception_order_shipment":
      return row(
        "출고 대상 주문",
        itemsTable(detail.items, [
          { key: "order_no", label: "주문번호" },
          { key: "item_name", label: "품목명" },
          { key: "item_code", label: "품목코드" },
          { key: "qty", label: "출고수량" },
        ])
      );

    case "holiday_setting":
      return [
        row(
          "휴무 기간",
          detail.holiday_end_date
            ? `${detail.holiday_start_date} ~ ${detail.holiday_end_date}`
            : detail.holiday_start_date
        ),
        row("주문 마감 일시", detail.order_cutoff_at),
        row("출고 재개일", detail.shipment_resume_date),
      ].join("");

    case "soldout_processing":
      return row(
        "품절 처리 품목",
        itemsTable(
          (detail.items ?? []).map((i: any) => ({
            ...i,
            period: i.period_type === "period" ? `${i.start_date ?? ""} ~ ${i.end_date ?? ""}` : "기간 없음",
          })),
          [
            { key: "item_name", label: "품목명" },
            { key: "item_code", label: "품목코드" },
            { key: "period", label: "품절 노출 기간" },
          ]
        )
      );

    case "popup_takedown":
      return [
        row("팝업명", detail.popup_name),
        row("내리는 사유", detail.reason),
        row("희망 내리기 일시", detail.desired_takedown_at),
      ].join("");

    default:
      return "";
  }
}

export async function sendRequestNotification(params: {
  requestNo: string;
  teamId: string;
  requesterName: string;
  requestType: string;
  createdAt: string;
  summary: string;
  erpDocNo?: string | null;
  detail?: any;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REQUEST_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "[email] RESEND_API_KEY 또는 REQUEST_NOTIFICATION_EMAIL 이 설정되지 않아 이메일 발송을 건너뜁니다."
    );
    return { skipped: true };
  }

  const resend = new Resend(apiKey);

  const html = `
    <p>새로운 업무 협조 요청이 등록되었습니다.</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><b>요청번호</b></td><td>${params.requestNo}</td></tr>
      <tr><td><b>팀</b></td><td>${teamName(params.teamId)}</td></tr>
      <tr><td><b>담당자</b></td><td>${params.requesterName}</td></tr>
      <tr><td><b>요청유형</b></td><td>${typeLabel(params.requestType)}</td></tr>
      <tr><td><b>상태</b></td><td>대기</td></tr>
      <tr><td><b>등록일시</b></td><td>${params.createdAt}</td></tr>
      ${row("전자결재 문서번호", params.erpDocNo)}
      <tr><td><b>요약</b></td><td>${escapeHtml(params.summary)}</td></tr>
      ${buildDetailRows(params.requestType, params.detail)}
    </table>
  `;

  return resend.emails.send({
    from: "업무협조요청시스템 <noreply@today-pharm.co.kr>",
    to,
    subject: `[업무협조요청] ${typeLabel(params.requestType)} - ${teamName(
      params.teamId
    )} ${params.requesterName}`,
    html,
  });
}
