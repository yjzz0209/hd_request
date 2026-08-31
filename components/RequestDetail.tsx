"use client";

import { imageTypeLabel } from "@/lib/requestTypes";

// 요청 조회 화면에서 항목을 펼쳤을 때 상세 내역을 보여주는 컴포넌트.
// 요청 유형마다 상세 테이블 구조가 달라서, 유형별로 보여줄 항목을 정리합니다.

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-neutral-500">{label}</span>
      <span className="text-neutral-800">{value}</span>
    </div>
  );
}

// 클릭하면 새 탭에서 여는 대신 파일을 바로 다운로드합니다.
// (원본 URL로 그냥 이동하면 브라우저가 이미지를 새 탭에 띄우기만 하고 저장은 안 시켜줘서,
// 파일을 직접 받아온 뒤 다운로드를 강제로 트리거합니다.)
async function downloadFile(url: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "file");
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // 다운로드가 막힌 환경이면 최소한 원본 파일은 볼 수 있도록 새 탭으로 엽니다.
    window.open(url, "_blank");
  }
}

function FileLink({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault();
        downloadFile(url);
      }}
      className="cursor-pointer text-[#12806f] underline"
    >
      파일 다운로드
    </a>
  );
}

function ItemsTable({
  items,
  columns,
}: {
  items: any[];
  columns: { key: string; label: string }[];
}) {
  if (!items || items.length === 0) return <p className="text-xs text-neutral-400">등록된 항목이 없습니다.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200 bg-[#f0f1f2] text-neutral-500">
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {row[c.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const YES_NO = (v: boolean) => (v ? "예" : "아니오");
const STOCK_TYPE = (v: string) => (v === "by_stock" ? "재고량에 따름" : "무한정 판매");
const SALE_PERIOD = (v: string) => (v === "fixed" ? "기간 있음" : "제한없음");

export function RequestDetail({ requestType, detail }: { requestType: string; detail: any }) {
  if (!detail) return <p className="text-xs text-neutral-400">불러오는 중...</p>;

  switch (requestType) {
    case "new_product":
    case "package": {
      const isPackage = requestType === "package";
      return (
        <div className="flex flex-col gap-2">
          {isPackage && <Row label="상품명" value={detail.product_name} />}
          {!isPackage && <Row label="자체 상품코드" value={detail.product_code} />}
          {!isPackage && <Row label="상품명" value={detail.product_name} />}
          <Row label="과세 여부" value={detail.is_taxable ? "과세" : "면세"} />
          <Row label="재고 유형" value={STOCK_TYPE(detail.stock_type)} />
          {detail.stock_type === "by_stock" && <Row label="상품 재고" value={detail.stock_qty} />}
          <Row label="묶음 주문 단위" value={detail.bundle_unit} />
          <Row label="판매기간" value={SALE_PERIOD(detail.sale_period_type)} />
          {detail.sale_period_type === "fixed" && (
            <Row label="판매 기간" value={`${detail.sale_start_date ?? ""} ~ ${detail.sale_end_date ?? ""}`} />
          )}
          <Row label="금융비 사용" value={YES_NO(detail.use_finance_fee)} />
          {isPackage && <Row label="할인 판매 총액" value={detail.total_price} />}
          <Row label="상세 설명 파일" value={<FileLink url={detail.description_file_url} />} />
          {!isPackage && detail.pricing_tiers?.length > 0 && (
            <div className="mt-1">
              <p className="mb-1 text-xs font-medium text-neutral-500">수량/등급별 가격</p>
              <ItemsTable
                items={detail.pricing_tiers}
                columns={[
                  { key: "min_qty", label: "최소 수량" },
                  { key: "grade", label: "등급" },
                  { key: "price", label: "가격" },
                ]}
              />
            </div>
          )}
          {isPackage && detail.items?.length > 0 && (
            <div className="mt-1">
              <p className="mb-1 text-xs font-medium text-neutral-500">패키지 구성품</p>
              <ItemsTable
                items={detail.items}
                columns={[
                  { key: "product_code", label: "상품코드" },
                  { key: "qty", label: "수량" },
                  { key: "allocated_price", label: "배분 금액" },
                ]}
              />
            </div>
          )}
          {detail.images?.length > 0 && (
            <div className="mt-1 flex flex-col gap-1">
              <p className="text-xs font-medium text-neutral-500">이미지</p>
              {detail.images.map((img: any, i: number) => (
                <div key={i} className="text-xs">
                  {imageTypeLabel(img.image_type)} · <FileLink url={img.file_url} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "product_change":
      return (
        <ItemsTable
          items={detail.items}
          columns={[
            { key: "target_product_code", label: "상품코드" },
            { key: "field_name", label: "변경 항목" },
            { key: "old_value", label: "기존 값" },
            { key: "new_value", label: "변경될 값" },
          ]}
        />
      );

    case "popup":
      return (
        <div className="flex flex-col gap-2">
          <Row label="노출 위치" value={[detail.expose_pc && "PC", detail.expose_mobile && "모바일"].filter(Boolean).join(", ")} />
          <Row label="팝업 제목" value={detail.title} />
          <Row label="노출 방식" value={detail.expose_type} />
          <Row label="노출 기간" value={detail.start_at ? `${detail.start_at} ~ ${detail.end_at ?? ""}` : null} />
          <Row label="오늘 하루 보지 않음" value={YES_NO(detail.hide_today_option)} />
          <Row label="이동 링크" value={detail.link_url} />
          <Row label="이미지" value={<FileLink url={detail.image_url} />} />
        </div>
      );

    case "banner":
      return (
        <div className="flex flex-col gap-2">
          <Row label="배너 위치" value={detail.banner_type} />
          <Row label="배너 제목" value={detail.title} />
          <Row label="이동 링크" value={detail.link_url} />
          <Row label="이미지" value={<FileLink url={detail.image_url} />} />
        </div>
      );

    case "etc":
      return (
        <div className="flex flex-col gap-2">
          <p className="whitespace-pre-wrap text-sm text-neutral-800">{detail.content}</p>
          {detail.file_url && <Row label="첨부파일" value={<FileLink url={detail.file_url} />} />}
        </div>
      );

    case "order_cancel":
      return (
        <div className="flex flex-col gap-2">
          <Row label="취소 사유" value={detail.reason} />
          <ItemsTable
            items={detail.items}
            columns={[
              { key: "order_no", label: "주문번호" },
              { key: "vendor_code", label: "거래처코드" },
              { key: "vendor_name", label: "거래처명" },
              { key: "item_no", label: "품목번호" },
              { key: "item_name", label: "품목명" },
              { key: "qty", label: "수량" },
            ]}
          />
        </div>
      );

    case "pharmacy_info_change":
      return (
        <div className="flex flex-col gap-2">
          <Row label="약국명" value={detail.pharmacy_name} />
          <Row label="약사명" value={detail.pharmacist_name} />
          <Row label="거래처코드" value={detail.vendor_code} />
          <Row label="사업자등록증" value={<FileLink url={detail.business_reg_file_url} />} />
          <ItemsTable
            items={detail.items}
            columns={[
              { key: "field_name", label: "변경 항목" },
              { key: "old_value", label: "기존 값" },
              { key: "new_value", label: "변경될 값" },
            ]}
          />
        </div>
      );

    case "exception_order_shipment":
      return (
        <ItemsTable
          items={detail.items}
          columns={[
            { key: "order_no", label: "주문번호" },
            { key: "item_name", label: "품목명" },
            { key: "item_code", label: "품목코드" },
            { key: "qty", label: "출고수량" },
          ]}
        />
      );

    case "holiday_setting":
      return (
        <div className="flex flex-col gap-2">
          <Row
            label="휴무 기간"
            value={detail.holiday_end_date ? `${detail.holiday_start_date} ~ ${detail.holiday_end_date}` : detail.holiday_start_date}
          />
          <Row label="주문 마감 일시" value={detail.order_cutoff_at ? new Date(detail.order_cutoff_at).toLocaleString("ko-KR") : null} />
          <Row label="출고 재개일" value={detail.shipment_resume_date} />
        </div>
      );

    case "soldout_processing":
      return (
        <ItemsTable
          items={detail.items?.map((i: any) => ({
            ...i,
            period: i.period_type === "period" ? `${i.start_date ?? ""} ~ ${i.end_date ?? ""}` : "기간 없음",
          }))}
          columns={[
            { key: "item_name", label: "품목명" },
            { key: "item_code", label: "품목코드" },
            { key: "period", label: "품절 노출 기간" },
          ]}
        />
      );

    case "popup_takedown":
      return (
        <div className="flex flex-col gap-2">
          <Row label="팝업명" value={detail.popup_name} />
          <Row label="내리는 사유" value={detail.reason} />
          <Row
            label="희망 내리기 일시"
            value={detail.desired_takedown_at ? new Date(detail.desired_takedown_at).toLocaleString("ko-KR") : null}
          />
        </div>
      );

    case "notice":
      return (
        <div className="flex flex-col gap-2">
          <Row label="공지 제목" value={detail.title} />
          <Row label="공지 게시 기간" value={`${detail.start_date} ~ ${detail.end_date}`} />
          {detail.content && (
            <div className="mt-1">
              <p className="mb-1 text-xs font-medium text-neutral-500">공지 내용</p>
              <p className="whitespace-pre-wrap text-sm text-neutral-800">{detail.content}</p>
            </div>
          )}
        </div>
      );

    default:
      return <p className="text-xs text-neutral-400">상세 정보가 없습니다.</p>;
  }
}
