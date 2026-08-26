"use client";

import { useState } from "react";
import { Field, TextInput, Select, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";
import { NEW_PRODUCT_FIELDS } from "@/lib/requestTypes";

type ChangeRow = { field_name: string; old_value: string; new_value: string };

export function ProductChangeForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [targetCode, setTargetCode] = useState("");
  const [rows, setRows] = useState<ChangeRow[]>([
    { field_name: NEW_PRODUCT_FIELDS[0].label, old_value: "", new_value: "" },
  ]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      items: rows
        .filter((r) => r.new_value !== "")
        .map((r) => ({
          target_product_code: targetCode,
          field_name: r.field_name,
          old_value: r.old_value || null,
          new_value: r.new_value,
        })),
    };
    const summary = `상품코드 ${targetCode} / 변경 항목 ${rows.length}건`;
    onSubmit(detail, summary);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="변경 대상 상품 (자체 상품코드)">
        <TextInput required value={targetCode} onChange={(e) => setTargetCode(e.target.value)} />
      </Field>

      <Field label="변경 항목" hint="변경하려는 항목을 선택하고, 기존 값과 변경될 값을 입력하세요.">
        <RepeatRows
          rows={rows}
          onChange={setRows}
          newRow={() => ({ field_name: NEW_PRODUCT_FIELDS[0].label, old_value: "", new_value: "" })}
          addLabel="변경 항목 추가"
          renderRow={(row, update, remove) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Select
                  value={row.field_name}
                  onChange={(e) => update({ field_name: e.target.value })}
                  className="flex-1"
                >
                  {NEW_PRODUCT_FIELDS.map((f) => (
                    <option key={f.key} value={f.label}>
                      {f.label}
                    </option>
                  ))}
                </Select>
                <button type="button" onClick={remove} className="text-xs text-[#d0492e]">
                  삭제
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="기존 값">
                  <TextInput value={row.old_value} onChange={(e) => update({ old_value: e.target.value })} />
                </Field>
                <Field label="변경될 값">
                  <TextInput required value={row.new_value} onChange={(e) => update({ new_value: e.target.value })} />
                </Field>
              </div>
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
