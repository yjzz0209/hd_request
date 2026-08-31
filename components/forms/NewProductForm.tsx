"use client";

import { useState } from "react";
import { Field, TextInput, Select, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";
import { FileUploadField } from "../FileUploadField";
import { IMAGE_TYPES } from "@/lib/requestTypes";

type Tier = { min_qty: string; grade: "M" | "MS" | "MS+"; price: string };
type ImageRow = { image_type: string; file_url: string; file_name?: string };

export function NewProductForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [productCode, setProductCode] = useState("");
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
  const [tiers, setTiers] = useState<Tier[]>([{ min_qty: "1", grade: "M", price: "" }]);
  const [images, setImages] = useState<ImageRow[]>([]);

  function setImage(imageType: string, url: string, name: string) {
    setImages((prev) => [...prev.filter((i) => i.image_type !== imageType), { image_type: imageType, file_url: url, file_name: name }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      product_code: productCode,
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
      pricing_tiers: tiers
        .filter((t) => t.price !== "")
        .map((t) => ({ min_qty: Number(t.min_qty), grade: t.grade, price: Number(t.price) })),
      images: images.map(({ image_type, file_url }) => ({ image_type, file_url })),
    };
    const summary = `상품코드 ${productCode} / ${productName} / ${isTaxable === "true" ? "과세" : "면세"}`;
    onSubmit(detail, summary);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="자체 상품코드">
        <TextInput required value={productCode} onChange={(e) => setProductCode(e.target.value)} />
      </Field>

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

      <Field label="수량/등급별 가격 세팅" hint="최소 수량 조건과 등급(M, MS, MS+)별 가격을 행으로 추가하세요.">
        <RepeatRows
          rows={tiers}
          onChange={setTiers}
          newRow={(): Tier => ({ min_qty: "1", grade: "M", price: "" })}
          addLabel="가격 행 추가"
          renderRow={(row, update, remove) => (
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <Field label="최소 수량">
                <TextInput type="number" value={row.min_qty} onChange={(e) => update({ min_qty: e.target.value })} />
              </Field>
              <Field label="등급">
                <Select value={row.grade} onChange={(e) => update({ grade: e.target.value as any })}>
                  <option value="M">M</option>
                  <option value="MS">MS</option>
                  <option value="MS+">MS+</option>
                </Select>
              </Field>
              <Field label="가격">
                <TextInput type="number" value={row.price} onChange={(e) => update({ price: e.target.value })} />
              </Field>
              <button type="button" onClick={remove} className="pb-2.5 text-xs text-[#d0492e]">
                삭제
              </button>
            </div>
          )}
        />
      </Field>

      <Field label="개별 이미지">
        <div className="flex flex-col gap-3">
          {IMAGE_TYPES.map((it) => (
            <FileUploadField
              key={it.key}
              label={it.label}
              hideLabel={it.key === "general"}
              titleHint={productName}
              onUploaded={(url, name) => setImage(it.key, url, name)}
            />
          ))}
        </div>
      </Field>

      <FileUploadField
        label="상품 상세 설명 문구 (Word 파일)"
        accept=".doc,.docx"
        titleHint={productName}
        onUploaded={(url) => setDescriptionFileUrl(url)}
      />

      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
