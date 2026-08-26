"use client";

import { useState } from "react";
import { Field, TextInput, TextArea, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";

type Item = {
  order_no: string;
  vendor_code: string;
  vendor_name: string;
  item_no: string;
  item_name: string;
  qty: string;
};

const emptyItem = (): Item => ({
  order_no: "",
  vendor_code: "",
  vendor_name: "",
  item_no: "",
  item_name: "",
  qty: "1",
});

export function OrderCancelForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      reason,
      items: items
        .filter((i) => i.order_no !== "")
        .map((i) => ({ ...i, qty: Number(i.qty) })),
    };
    onSubmit(detail, `취소 대상 ${items.length}건 / 사유: ${reason.slice(0, 40)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="취소 사유">
        <TextArea required value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <Field label="취소 대상 주문" hint="주문번호, 거래처코드, 거래처명, 품목번호, 품목명, 수량을 행으로 추가하세요.">
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
                <Field label="수량">
                  <TextInput type="number" value={row.qty} onChange={(e) => update({ qty: e.target.value })} />
                </Field>
                <Field label="거래처코드">
                  <TextInput value={row.vendor_code} onChange={(e) => update({ vendor_code: e.target.value })} />
                </Field>
                <Field label="거래처명">
                  <TextInput value={row.vendor_name} onChange={(e) => update({ vendor_name: e.target.value })} />
                </Field>
                <Field label="품목번호">
                  <TextInput value={row.item_no} onChange={(e) => update({ item_no: e.target.value })} />
                </Field>
                <Field label="품목명">
                  <TextInput value={row.item_name} onChange={(e) => update({ item_name: e.target.value })} />
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
