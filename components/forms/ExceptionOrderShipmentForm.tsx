"use client";

import { useState } from "react";
import { Field, TextInput, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";

type Item = {
  order_no: string;
  item_name: string;
  item_code: string;
  qty: string;
};

const emptyItem = (): Item => ({ order_no: "", item_name: "", item_code: "", qty: "1" });

export function ExceptionOrderShipmentForm({
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
        .filter((i) => i.order_no !== "")
        .map((i) => ({ ...i, qty: Number(i.qty) })),
    };
    onSubmit(detail, `예외 주문건 출고 요청 ${items.length}건`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="출고 대상 주문" hint="주문번호, 품목명, 품목코드, 출고수량을 행으로 추가하세요.">
        <RepeatRows
          rows={items}
          onChange={setItems}
          newRow={emptyItem}
          addLabel="주문 행 추가"
          renderRow={(row, update, remove) => (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="주문번호">
                  <TextInput value={row.order_no} onChange={(e) => update({ order_no: e.target.value })} />
                </Field>
                <Field label="출고수량">
                  <TextInput type="number" value={row.qty} onChange={(e) => update({ qty: e.target.value })} />
                </Field>
                <Field label="품목명">
                  <TextInput value={row.item_name} onChange={(e) => update({ item_name: e.target.value })} />
                </Field>
                <Field label="품목코드">
                  <TextInput value={row.item_code} onChange={(e) => update({ item_code: e.target.value })} />
                </Field>
              </div>
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
