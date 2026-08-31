// 요청 상세를 "표 이미지로 저장" 기능(app/api/requests/[id]/image)에서 쓰는, 이미지 렌더링 전용
// 데이터 형태로 뽑아주는 함수입니다. lib/email.ts의 buildDetailCells와 항목 구성은 같지만,
// 이미지 생성기(satori/next-og)는 임의의 HTML 문자열을 못 그리고 순수 JSX만 그릴 수 있어서
// 값을 HTML 문자열이 아니라 이런 구조화된 데이터로 따로 뽑습니다. 이미 안정적으로 동작 중인
// 이메일 발송 로직(buildDetailCells)에 영향이 가지 않도록 일부러 별도 함수로 둡니다.

import { imageTypeLabel } from "./requestTypes";

export type ImageField =
  | { kind: "text"; label: string; value: string }
  | { kind: "table"; label: string; columns: { key: string; label: string }[]; rows: any[] };

function text(label: string, value: unknown): ImageField {
  return { kind: "text", label, value: value === null || value === undefined || value === "" ? "-" : String(value) };
}

function table(label: string, columns: { key: string; label: string }[], rows: any[] | undefined): ImageField {
  return { kind: "table", label, columns, rows: Array.isArray(rows) ? rows : [] };
}

const YES_NO = (v: boolean) => (v ? "예" : "아니오");
const STOCK_TYPE = (v: string) => (v === "by_stock" ? "재고량에 따름" : "무한정 판매");
const SALE_PERIOD = (v: string) => (v === "fixed" ? "기간 있음" : "제한없음");

// 사진/첨부파일 항목은 이미지 안에 실제 사진을 넣지 않고(생성 속도·안정성 때문에),
// 첨부 여부와 개수만 텍스트로 보여줍니다. 실제 파일은 관리자 화면/엑셀 다운로드로 받습니다.
function fileField(url?: string | null) {
  return url ? "첨부됨" : "없음";
}

export function buildImageFields(requestType: string, detail: any): ImageField[] {
  if (!detail) return [];

  switch (requestType) {
    case "new_product":
    case "package": {
      const isPackage = requestType === "package";
      const fields: ImageField[] = [
        ...(isPackage ? [] : [text("자체 상품코드", detail.product_code)]),
        text("상품명", detail.product_name),
        text("과세 여부", detail.is_taxable ? "과세" : "면세"),
        text("판매 재고 유형", STOCK_TYPE(detail.stock_type)),
        ...(detail.stock_type === "by_stock" ? [text("상품 재고", detail.stock_qty)] : []),
        text("묶음 주문 단위", detail.bundle_unit),
        text("판매기간", SALE_PERIOD(detail.sale_period_type)),
        ...(detail.sale_period_type === "fixed"
          ? [text("판매 기간", `${detail.sale_start_date ?? ""} ~ ${detail.sale_end_date ?? ""}`)]
          : []),
        text("금융비 사용 설정", YES_NO(detail.use_finance_fee)),
        ...(isPackage ? [text("할인 판매 총액", detail.total_price)] : []),
        text("상품 상세 설명 문구", fileField(detail.description_file_url)),
      ];
      if (!isPackage) {
        fields.push(
          table(
            "수량/등급별 가격 세팅",
            [
              { key: "min_qty", label: "최소 수량" },
              { key: "grade", label: "등급" },
              { key: "price", label: "가격" },
            ],
            detail.pricing_tiers
          )
        );
      } else {
        fields.push(
          table(
            "패키지 구성품",
            [
              { key: "product_code", label: "상품코드" },
              { key: "qty", label: "수량" },
              { key: "allocated_price", label: "배분 금액" },
            ],
            detail.items
          )
        );
      }
      fields.push(
        text(
          "개별 이미지",
          Array.isArray(detail.images) && detail.images.length > 0
            ? `${detail.images.length}개 첨부 (${detail.images.map((i: any) => imageTypeLabel(i.image_type)).join(", ")})`
            : "없음"
        )
      );
      return fields;
    }

    case "product_change":
      return [
        table(
          "변경 항목",
          [
            { key: "target_product_code", label: "상품코드" },
            { key: "field_name", label: "변경 항목" },
            { key: "old_value", label: "기존 값" },
            { key: "new_value", label: "변경될 값" },
          ],
          detail.items
        ),
      ];

    case "popup":
      return [
        text("노출 위치", [detail.expose_pc && "PC", detail.expose_mobile && "모바일"].filter(Boolean).join(", ")),
        text("팝업 제목", detail.title),
        text("노출 방식", detail.expose_type),
        text("노출 기간", detail.start_at ? `${detail.start_at} ~ ${detail.end_at ?? ""}` : "항상 노출"),
        text("오늘 하루 보지 않음", YES_NO(detail.hide_today_option)),
        text("이미지", fileField(detail.image_url)),
        text("이동 링크", detail.link_url),
      ];

    case "banner":
      return [
        text("배너 위치", detail.banner_type),
        text("배너 제목", detail.title),
        text("이미지", fileField(detail.image_url)),
        text("이동 링크", detail.link_url),
      ];

    case "etc":
      return [text("내용", detail.content)];

    case "order_cancel":
      return [
        text("취소 사유", detail.reason),
        table(
          "취소 대상 주문",
          [
            { key: "order_no", label: "주문번호" },
            { key: "vendor_code", label: "거래처코드" },
            { key: "vendor_name", label: "거래처명" },
            { key: "item_no", label: "품목번호" },
            { key: "item_name", label: "품목명" },
            { key: "qty", label: "수량" },
          ],
          detail.items
        ),
      ];

    case "pharmacy_info_change":
      return [
        text("약국명", detail.pharmacy_name),
        text("약사명", detail.pharmacist_name),
        text("거래처코드", detail.vendor_code),
        text("사업자등록증", fileField(detail.business_reg_file_url)),
        table(
          "변경 항목",
          [
            { key: "field_name", label: "변경 항목" },
            { key: "old_value", label: "기존 값" },
            { key: "new_value", label: "변경될 값" },
          ],
          detail.items
        ),
      ];

    case "exception_order_shipment":
      return [
        table(
          "출고 대상 주문",
          [
            { key: "order_no", label: "주문번호" },
            { key: "item_name", label: "품목명" },
            { key: "item_code", label: "품목코드" },
            { key: "qty", label: "출고수량" },
          ],
          detail.items
        ),
      ];

    case "holiday_setting":
      return [
        text(
          "휴무 기간",
          detail.holiday_end_date
            ? `${detail.holiday_start_date} ~ ${detail.holiday_end_date}`
            : detail.holiday_start_date
        ),
        text("주문 마감 일시", detail.order_cutoff_at),
        text("출고 재개일", detail.shipment_resume_date),
      ];

    case "soldout_processing":
      return [
        table(
          "품절 처리 품목",
          [
            { key: "item_name", label: "품목명" },
            { key: "item_code", label: "품목코드" },
            { key: "period", label: "품절 노출 기간" },
          ],
          (detail.items ?? []).map((i: any) => ({
            ...i,
            period: i.period_type === "period" ? `${i.start_date ?? ""} ~ ${i.end_date ?? ""}` : "기간 없음",
          }))
        ),
      ];

    case "popup_takedown":
      return [
        text("팝업명", detail.popup_name),
        text("내리는 사유", detail.reason),
        text("희망 내리기 일시", detail.desired_takedown_at),
      ];

    case "notice":
      return [
        text("공지 제목", detail.title),
        text("공지 게시 기간", `${detail.start_date ?? ""} ~ ${detail.end_date ?? ""}`),
        text("공지 내용", detail.content),
      ];

    default:
      return [];
  }
}
