import { Resend } from "resend";
import { teamName, typeLabel } from "./requestTypes";

// Power Automate가 Outlook 트리거로 이 이메일을 감지해서
// SharePoint/OneDrive의 엑셀 파일에 한 행씩 옮겨 적습니다.
// 그래서 아래 표 형식(라벨: 값)을 절대 임의로 바꾸면 안 되고,
// 바꿔야 한다면 Power Automate 흐름의 파싱 로직도 함께 수정해야 합니다.
//
// 이미지 파일은 셀에 직접 넣지 않고(스토리지 폴더에 파일로만 저장),
// 이미지가 저장된 위치를 알 수 있도록 링크(URL) 텍스트만 값으로 넣습니다.
//
// 공통+상세 항목 표는 라벨:값 한 쌍씩 세로로 늘어놓지 않고, 한 행에 두 쌍(라벨/값/라벨/값)씩
// 나란히 배치합니다. 변경 항목·출고 대상 주문처럼 건별 목록이 있는 항목은 이 규칙과 별개로,
// 값 칸 안에 자체 목록 표를 그대로 담습니다.

type Cell = { label: string; html: string };

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 일반 텍스트 값용. 값을 이스케이프해서 태그가 글자 그대로 보이지 않게 합니다.
function cell(label: string, value: unknown): Cell {
  return { label, html: escapeHtml(value) || "-" };
}

// itemsTable()/fileLinkValue()처럼 이미 안전하게 만들어진 HTML 값용.
// 여기서 다시 이스케이프하면 표/링크 태그가 글자 그대로 노출되므로 그대로 씁니다.
function cellRaw(label: string, html: string): Cell {
  return { label, html: html || "-" };
}

// 라벨 칸/값 칸에 공통으로 쓰는 인라인 스타일. 이메일 클라이언트는 <style> 블록이나 CSS
// 클래스를 무시하는 경우가 많아서(특히 Outlook) 태그 안에 직접 style로 넣습니다.
// 라벨은 글자 중간(음절 사이)에서 잘리지 않게 word-break:keep-all만 쓰고(칸이 좁으면 띄어쓰기
// 위치에서만 줄바꿈), 값은 긴 URL 등이 표를 밀어내지 않도록 강제로 줄바꿈되게(break-word) 합니다.
const LABEL_TD_STYLE =
  "padding:6px 8px;background:#f5f5f5;word-break:keep-all;overflow-wrap:normal;vertical-align:top;border:1px solid #ddd;";
const VALUE_TD_STYLE =
  "padding:6px 8px;word-break:break-word;overflow-wrap:break-word;vertical-align:top;border:1px solid #ddd;";

// 라벨:값 쌍들을 한 행에 두 쌍씩 나란히 배치한 <tr> 목록으로 렌더링합니다.
// 표 전체는 4개 칼럼(라벨/값/라벨/값) 너비를 인라인 스타일로 고정해서, 행마다 칼럼 너비가
// 제각각 달라지며 라벨 글자가 중간에서 잘려 줄바꿈되는 문제를 막습니다.
function renderCells(cells: (Cell | false | null | undefined)[]): string {
  const list = cells.filter((c): c is Cell => Boolean(c));
  const PER_ROW = 2;
  const rows: string[] = [];
  for (let i = 0; i < list.length; i += PER_ROW) {
    const pair = list.slice(i, i + PER_ROW);
    const tds = pair
      .map(
        (c) =>
          `<td style="${LABEL_TD_STYLE}"><b>${escapeHtml(c.label)}</b></td><td style="${VALUE_TD_STYLE}">${c.html}</td>`
      )
      .join("");
    const padding = `<td style="${LABEL_TD_STYLE}"></td><td style="${VALUE_TD_STYLE}"></td>`.repeat(
      PER_ROW - pair.length
    );
    rows.push(`<tr>${tds}${padding}</tr>`);
  }
  return rows.join("");
}

// 값 칸에 원본 URL을 그대로 노출하면(특히 긴 이미지 링크) 줄바꿈이 이상하게 되면서 표가
// 깨져 보이므로, 짧은 안내 문구만 링크로 보여줍니다. 이메일은 자바스크립트를 못 쓰기 때문에
// (사이트 화면에서 쓴 것과 같은 방식으로) 강제 다운로드를 걸 수는 없지만, Supabase 저장소
// 링크는 끝에 ?download를 붙이면 서버가 알아서 "다운로드"로 응답하도록 되어 있어서
// 클릭하면 새 탭에서 열리는 대신 바로 다운로드됩니다.
function fileLinkValue(url?: string | null, label = "파일 다운로드") {
  if (!url) return "";
  const downloadUrl = url.includes("?") ? `${url}&download` : `${url}?download`;
  const safe = escapeHtml(downloadUrl);
  return `<a href="${safe}" style="color:#12806f;">${escapeHtml(label)}</a>`;
}

function itemsTable(items: any[] | undefined, columns: { key: string; label: string }[]) {
  if (!Array.isArray(items) || items.length === 0) return "(없음)";
  const cellStyle = "padding:4px 8px;border:1px solid #ddd;word-break:break-word;overflow-wrap:break-word;";
  const headStyle = `${cellStyle}background:#f5f5f5;word-break:keep-all;overflow-wrap:normal;`;
  const head = columns.map((c) => `<th style="${headStyle}">${escapeHtml(c.label)}</th>`).join("");
  const body = items
    .map(
      (it) =>
        `<tr>${columns.map((c) => `<td style="${cellStyle}">${escapeHtml(it[c.key])}</td>`).join("")}</tr>`
    )
    .join("");
  return `<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;table-layout:fixed;"><tr>${head}</tr>${body}</table>`;
}

// Power Automate가 이미지를 OneDrive로 복사해 엑셀에 링크를 남길 때 쓰는 목록.
// 요청 유형과 상관없이 detail 안의 이미지/파일 URL을 전부 모아줍니다.
function extractImageUrls(detail: any): { label: string; url: string }[] {
  if (!detail) return [];
  const out: { label: string; url: string }[] = [];
  if (detail.image_url) out.push({ label: "이미지", url: detail.image_url });
  if (detail.description_file_url) out.push({ label: "상세 설명 파일", url: detail.description_file_url });
  if (detail.business_reg_file_url) out.push({ label: "사업자등록증", url: detail.business_reg_file_url });
  if (Array.isArray(detail.images)) {
    for (const img of detail.images) {
      if (img?.file_url) out.push({ label: img.image_type ?? "이미지", url: img.file_url });
    }
  }
  return out;
}

const YES_NO = (v: boolean) => (v ? "예" : "아니오");
const STOCK_TYPE = (v: string) => (v === "by_stock" ? "재고량에 따름" : "무한정 판매");
const SALE_PERIOD = (v: string) => (v === "fixed" ? "기간 있음" : "제한없음");

// 요청 유형별 상세 항목을 라벨:값 쌍 목록으로 만들어줍니다. (요청 조회 화면의 RequestDetail과 동일한 항목 기준)
function buildDetailCells(requestType: string, detail: any): (Cell | false)[] {
  if (!detail) return [];

  switch (requestType) {
    case "new_product":
    case "package": {
      const isPackage = requestType === "package";
      return [
        !isPackage && cell("자체 상품코드", detail.product_code),
        cell("상품명", detail.product_name),
        cell("과세 여부", detail.is_taxable ? "과세" : "면세"),
        cell("판매 재고 유형", STOCK_TYPE(detail.stock_type)),
        detail.stock_type === "by_stock" && cell("상품 재고", detail.stock_qty),
        cell("묶음 주문 단위", detail.bundle_unit),
        cell("판매기간", SALE_PERIOD(detail.sale_period_type)),
        detail.sale_period_type === "fixed" &&
          cell("판매 기간", `${detail.sale_start_date ?? ""} ~ ${detail.sale_end_date ?? ""}`),
        cell("금융비 사용 설정", YES_NO(detail.use_finance_fee)),
        isPackage && cell("할인 판매 총액", detail.total_price),
        cellRaw("상품 상세 설명 문구", fileLinkValue(detail.description_file_url)),
        !isPackage &&
          cellRaw(
            "수량/등급별 가격 세팅",
            itemsTable(detail.pricing_tiers, [
              { key: "min_qty", label: "최소 수량" },
              { key: "grade", label: "등급" },
              { key: "price", label: "가격" },
            ])
          ),
        isPackage &&
          cellRaw(
            "패키지 구성품",
            itemsTable(detail.items, [
              { key: "product_code", label: "상품코드" },
              { key: "qty", label: "수량" },
              { key: "allocated_price", label: "배분 금액" },
            ])
          ),
        cellRaw(
          "개별 이미지",
          (detail.images ?? [])
            .map((img: any) => `${escapeHtml(img.image_type)}: ${fileLinkValue(img.file_url)}`)
            .join("<br/>") || "(없음)"
        ),
      ];
    }

    case "product_change":
      return [
        cellRaw(
          "변경 항목",
          itemsTable(detail.items, [
            { key: "target_product_code", label: "상품코드" },
            { key: "field_name", label: "변경 항목" },
            { key: "old_value", label: "기존 값" },
            { key: "new_value", label: "변경될 값" },
          ])
        ),
      ];

    case "popup":
      return [
        cell("노출 위치", [detail.expose_pc && "PC", detail.expose_mobile && "모바일"].filter(Boolean).join(", ")),
        cell("팝업 제목", detail.title),
        cell("노출 방식", detail.expose_type),
        cell("노출 기간", detail.start_at ? `${detail.start_at} ~ ${detail.end_at ?? ""}` : "항상 노출"),
        cell("오늘 하루 보지 않음", YES_NO(detail.hide_today_option)),
        cellRaw("이미지", fileLinkValue(detail.image_url)),
        cell("이동 링크", detail.link_url),
      ];

    case "banner":
      return [
        cell("배너 위치", detail.banner_type),
        cell("배너 제목", detail.title),
        cellRaw("이미지", fileLinkValue(detail.image_url)),
        cell("이동 링크", detail.link_url),
      ];

    case "etc":
      return [cell("내용", detail.content)];

    case "order_cancel":
      return [
        cell("취소 사유", detail.reason),
        cellRaw(
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
      ];

    case "pharmacy_info_change":
      return [
        cell("약국명", detail.pharmacy_name),
        cell("약사명", detail.pharmacist_name),
        cell("거래처코드", detail.vendor_code),
        cellRaw("사업자등록증", fileLinkValue(detail.business_reg_file_url)),
        cellRaw(
          "변경 항목",
          itemsTable(detail.items, [
            { key: "field_name", label: "변경 항목" },
            { key: "old_value", label: "기존 값" },
            { key: "new_value", label: "변경될 값" },
          ])
        ),
      ];

    case "exception_order_shipment":
      return [
        cellRaw(
          "출고 대상 주문",
          itemsTable(detail.items, [
            { key: "order_no", label: "주문번호" },
            { key: "item_name", label: "품목명" },
            { key: "item_code", label: "품목코드" },
            { key: "qty", label: "출고수량" },
          ])
        ),
      ];

    case "holiday_setting":
      return [
        cell(
          "휴무 기간",
          detail.holiday_end_date
            ? `${detail.holiday_start_date} ~ ${detail.holiday_end_date}`
            : detail.holiday_start_date
        ),
        cell("주문 마감 일시", detail.order_cutoff_at),
        cell("출고 재개일", detail.shipment_resume_date),
      ];

    case "soldout_processing":
      return [
        cellRaw(
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
        ),
      ];

    case "popup_takedown":
      return [
        cell("팝업명", detail.popup_name),
        cell("내리는 사유", detail.reason),
        cell("희망 내리기 일시", detail.desired_takedown_at),
      ];

    case "notice":
      return [
        cell("공지 제목", detail.title),
        cell("공지 게시 기간", `${detail.start_date ?? ""} ~ ${detail.end_date ?? ""}`),
      ];

    default:
      return [];
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

  const cells: (Cell | false)[] = [
    cell("요청번호", params.requestNo),
    cell("팀", teamName(params.teamId)),
    cell("담당자", params.requesterName),
    cell("요청유형", typeLabel(params.requestType)),
    cell("상태", "대기"),
    cell("등록일시", params.createdAt),
    cell("전자결재 문서번호", params.erpDocNo),
    cell("요약", params.summary),
    ...buildDetailCells(params.requestType, params.detail),
  ];

  // Power Automate가 표를 긁어 읽는 대신 이 JSON만 파싱하면 되도록, 화면에는 안 보이는
  // 데이터 블록을 이메일 본문 맨 아래에 함께 넣습니다. 표의 라벨:값 배치(한 행에 몇 개씩)가
  // 바뀌어도 이 JSON 구조는 그대로라 파싱이 흔들리지 않습니다.
  // <!--DATA_START--> ~ <!--DATA_END--> 사이의 텍스트를 그대로 Parse JSON에 넣으면 됩니다.
  const payload = {
    requestNo: params.requestNo,
    teamId: params.teamId,
    teamName: teamName(params.teamId),
    requesterName: params.requesterName,
    requestType: params.requestType,
    requestTypeLabel: typeLabel(params.requestType),
    status: "pending",
    statusLabel: "대기",
    createdAt: params.createdAt,
    erpDocNo: params.erpDocNo ?? null,
    summary: params.summary,
    detail: params.detail ?? null,
    imageUrls: extractImageUrls(params.detail),
  };
  const payloadJson = JSON.stringify(payload).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

  // table-layout:fixed + colgroup으로 라벨/값 칸 너비를 고정합니다. 이게 없으면 행마다
  // 내용 길이에 따라 칼럼 너비가 제각각 정해지면서 라벨 글자가 중간에 잘려 줄바꿈되거나
  // 표 전체가 넓어져 깨져 보입니다.
  const html = `
    <div style="font-family:sans-serif;font-size:13px;color:#222;max-width:680px;">
      <p>새로운 업무 협조 요청이 등록되었습니다.</p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;table-layout:fixed;">
        <colgroup>
          <col style="width:20%;" />
          <col style="width:30%;" />
          <col style="width:20%;" />
          <col style="width:30%;" />
        </colgroup>
        ${renderCells(cells)}
      </table>
      <div style="display:none">
        <!--DATA_START-->${payloadJson}<!--DATA_END-->
      </div>
    </div>
  `;

  // 화면에 안 보이는 JSON 블록과 별도로, 같은 내용을 첨부파일로도 넣어둡니다.
  // Power Automate에서 본문을 잘라내는 수식(Compose) 없이, 이 첨부파일 하나만 그대로
  // Parse JSON에 넣으면 되도록 하기 위한 용도입니다(설정이 훨씬 간단해집니다).
  const attachmentJson = JSON.stringify(payload, null, 2);

  return resend.emails.send({
    from: "업무협조요청시스템 <noreply@today-pharm.co.kr>",
    to,
    subject: `[업무협조요청] ${typeLabel(params.requestType)} - ${teamName(
      params.teamId
    )} ${params.requesterName}`,
    html,
    attachments: [
      {
        filename: `${params.requestNo}.json`,
        content: Buffer.from(attachmentJson, "utf-8").toString("base64"),
      },
    ],
  });
}

// 메인 화면 "문의하기"로 들어온 문의/의견 알림. 요청 시스템과 달리 팀/요청유형이 없는
// 별도 문의함이라, 제목에 [업무협조요청]을 넣지 않습니다(Power Automate 필터가
// 제목에 [업무협조요청]이 포함된 메일만 감지하므로, 이 메일은 그 흐름에 잡히지 않고
// 이 시스템의 관리자 알림 메일함에만 도착합니다).
export async function sendInquiryNotification(params: {
  name: string;
  contact?: string | null;
  content: string;
  createdAt: string;
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

  const cells: Cell[] = [
    cell("이름", params.name),
    cell("연락처", params.contact),
    cell("등록일시", params.createdAt),
    cell("문의/의견 내용", params.content),
  ];

  const html = `
    <div style="font-family:sans-serif;font-size:13px;color:#222;max-width:680px;">
      <p>오늘의팜 문의하기로 새 문의/의견이 등록되었습니다.</p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;table-layout:fixed;">
        <colgroup>
          <col style="width:20%;" />
          <col style="width:30%;" />
          <col style="width:20%;" />
          <col style="width:30%;" />
        </colgroup>
        ${renderCells(cells)}
      </table>
    </div>
  `;

  return resend.emails.send({
    from: "업무협조요청시스템 <noreply@today-pharm.co.kr>",
    to,
    subject: `[문의하기] ${params.name}`,
    html,
  });
}
