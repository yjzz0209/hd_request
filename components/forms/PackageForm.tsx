"use client";

import { useState } from "react";
import { Field, TextInput, Select, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";
import { FileUploadField } from "../FileUploadField";
import { IMAGE_TYPES } from "@/lib/requestTypes";

type Item = { product_code: string; qty: string; allocated_price: string };
type ImageRow = { image_type: string; file_url: string };

export function PackageForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [productName, setProductName] = useState("");
  const [isTaxable, setIsTaxable] = useState<"true" | "false">("true");
  const [stockType, setStockType] = useState<"unlimited" | "by_stock">("unlimited");
  const [stockQty, setStockQty] = useState("");
  const [bundleUnit, setBundleUnit] = useState("1");
  const [salePeriodType, setSalePeriodType] = useState<"unlimited" | "fixed">("unlimited");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");
  const [useFinanceFee, setUseFinanceFee] = useState<"true" | "false">("false");
  const [descriptionFileUrl, setDescriptionFileUrl] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [items, setItems] = useState<Item[]>([{ product_code: "", qty: "1", allocated_price: "" }]);
  const [images, setImages] = useState<ImageRow[]>([]);

  function setImage(imageType: string, url: string) {
    setImages((prev) => [...prev.filter((i) => i.image_type !== imageType), { image_type: imageType, file_url: url }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      product_name: productName,
      is_taxable: isTaxable === "true",
      stock_type: stockType,
      stock_qty: stockType === "by_stock" ? Number(stockQty) : null,
      bundle_unit: Number(bundleUnit),
      sale_period_type: salePeriodType,
      sale_start_date: salePeriodType === "fixed" ? saleStart : null,
      sale_end_date: salePeriodType === "fixed" ? saleEnd : null,
      use_finance_fee: useFinanceFee === "true",
      description_file_url: descriptionFileUrl || null,
      total_price: Number(totalPrice),
      images,
      items: items
        .filter((i) => i.product_code !== "")
        .map((i) => ({ product_code: i.product_code, qty: Number(i.qty), allocated_price: Number(i.allocated_price) })),
    };
    onSubmit(detail, `패키지 "${productName}" (구성품 ${items.length}개)`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="상품명">
        <TextInput required value={productName} onChange={(e) => setProductName(e.target.value)} />
      </Field>

      <Field label="과세 여부">
        <Select value={isTaxable} onChange={(e) => setIsTaxable(e.target.value as any)}>
          <option value="true">과세</option>
          <option value="false">면세</option>
        </Select>
      </Field>

      <Field label="판매 재고 유형">
        <Select value={stockType} onChange={(e) => setStockType(e.target.value as any)}>
          <option value="unlimited">무한정 판매</option>
          <option value="by_stock">재고량에 따름</option>
        </Select>
      </Field>
      {stockType === "by_stock" && (
        <Field label="상품 재고">
          <TextInput required type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
        </Field>
      )}

      <Field label="묶음 주문 단위">
        <TextInput required type="number" min={1} value={bundleUnit} onChange={(e) => setBundleUnit(e.target.value)} />
      </Field>

      <Field label="판매기간">
        <Select value={salePeriodType} onChange={(e) => setSalePeriodType(e.target.value as any)}>
          <option value="unlimited">제한없음</option>
          <option value="fixed">시작일·종료일 있음</option>
        </Select>
      </Field>
      {salePeriodType === "fixed" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일">
            <TextInput required type="date" value={saleStart} onChange={(e) => setSaleStart(e.target.value)} />
          </Field>
          <Field label="종료일">
            <TextInput required type="date" value={saleEnd} onChange={(e) => setSaleEnd(e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="금융비 사용 설정">
        <Select value={useFinanceFee} onChange={(e) => setUseFinanceFee(e.target.value as any)}>
          <option value="false">미사용</option>
          <option value="true">사용</option>
        </Select>
      </Field>

      <Field label="개별 이미지">
        <div className="flex flex-col gap-3">
          {/* 기타 이미지: 용도를 딱히 구분하지 않는 항목이라 "개별 이미지" 라벨 바로 아래
              단독으로 두고, 나머지 6개 정해진 용도 항목만 카드형 2열 그리드로 배치합니다. */}
          <FileUploadField
            label="기타 이미지"
            hideLabel
            titleHint={productName}
            onUploaded={(url) => setImage("general", url)}
          />
          <div className="grid grid-cols-2 gap-3">
            {IMAGE_TYPES.filter((it) => it.key !== "general").map((it) => (
              <div key={it.key} className="rounded-2xl bg-neutral-50 p-3">
                <FileUploadField
                  label={it.label}
                  titleHint={productName}
                  onUploaded={(url) => setImage(it.key, url)}
                />
              </div>
            ))}
          </div>
        </div>
      </Field>

      <FileUploadField
        label="상품 상세 설명 문구 (Word 파일)"
        accept=".doc,.docx"
        titleHint={productName}
        onUploaded={(url) => setDescriptionFileUrl(url)}
      />

      <Field label="할인 판매 총액">
        <TextInput required type="number" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
      </Field>

      <Field label="패키지 구성품" hint="구성품별 자체 상품코드, 수량, 배분 금액을 입력하세요.">
        <RepeatRows
          rows={items}
          onChange={setItems}
          newRow={() => ({ product_code: "", qty: "1", allocated_price: "" })}
          addLabel="구성품 추가"
          renderRow={(row, update, remove) => (
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <Field label="자체 상품코드">
                <TextInput value={row.product_code} onChange={(e) => update({ product_code: e.target.value })} />
              </Field>
              <Field label="수량">
                <TextInput type="number" value={row.qty} onChange={(e) => update({ qty: e.target.value })} />
              </Field>
              <Field label="배분 금액">
                <TextInput type="number" value={row.allocated_price} onChange={(e) => update({ allocated_price: e.target.value })} />
              </Field>
              <button type="button" onClick={remove} className="pb-2.5 text-xs text-[#d0492e]">
                삭제
              </button>
            </div>
          )}
        />
      </Field>

      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
