"use client";

import { useState } from "react";
import { Field, TextInput, Select, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";

type Item = {
  item_name: string;
  item_code: string;
  period_type: "none" | "period";
  start_date: string;
  end_date: string;
};

const emptyItem = (): Item => ({ item_name: "", item_code: "", period_type: "none", start_date: "", end_date: "" });

export function SoldoutProcessingForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      items: items
        .filter((i) => i.item_name !== "")
        .map((i) => ({
          item_name: i.item_name,
          item_code: i.item_code,
          period_type: i.period_type,
          start_date: i.period_type === "period" ? i.start_date || null : null,
          end_date: i.period_type === "period" ? i.end_date || null : null,
        })),
    };
    onSubmit(detail, `품절처리 요청 ${items.length}건`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="품절 처리 품목" hint="품목명, 품목코드, 품절 노출 기간을 행으로 추가하세요.">
        <RepeatRows
          rows={items}
          onChange={setItems}
          newRow={emptyItem}
          addLabel="품목 추가"
          renderRow={(row, update, remove) => (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="품목명">
                  <TextInput value={row.item_name} onChange={(e) => update({ item_name: e.target.value })} />
                </Field>
                <Field label="품목코드">
                  <TextInput value={row.item_code} onChange={(e) => update({ item_code: e.target.value })} />
                </Field>
              </div>
              <Field label="품절 노출 기간">
                <Select
                  value={row.period_type}
                  onChange={(e) => update({ period_type: e.target.value as "none" | "period" })}
                >
                  <option value="none">기간 없음</option>
                  <option value="period">기간 설정</option>
                </Select>
              </Field>
              {row.period_type === "period" && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="시작일">
                    <TextInput type="date" value={row.start_date} onChange={(e) => update({ start_date: e.target.value })} />
                  </Field>
                  <Field label="종료일">
                    <TextInput type="date" value={row.end_date} onChange={(e) => update({ end_date: e.target.value })} />
                  </Field>
                </div>
              )}
              <button type="button" onClick={remove} className="self-start text-xs text-[#d0492e]">
                이 행 삭제
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
