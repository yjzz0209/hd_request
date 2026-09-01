"use client";

import { useState } from "react";
import { Field, TextInput, PrimaryButton } from "../ui";
import { RepeatRows } from "../RepeatRows";
import { FileUploadField, useUploadGuard } from "../FileUploadField";

type ChangeRow = { field_name: string; old_value: string; new_value: string };

const emptyRow = (): ChangeRow => ({ field_name: "", old_value: "", new_value: "" });

// 유통전략팀이 혁신팀에 보내는 약국 정보 변경 요청
export function PharmacyInfoChangeForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacistName, setPharmacistName] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [businessRegFileUrl, setBusinessRegFileUrl] = useState("");
  const [rows, setRows] = useState<ChangeRow[]>([emptyRow()]);
  const { anyUploading, onUploadingChange } = useUploadGuard();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      pharmacy_name: pharmacyName,
      pharmacist_name: pharmacistName,
      vendor_code: vendorCode,
      business_reg_file_url: businessRegFileUrl || null,
      items: rows
        .filter((r) => r.new_value !== "")
        .map((r) => ({
          field_name: r.field_name,
          old_value: r.old_value || null,
          new_value: r.new_value,
        })),
    };
    const summary = `${pharmacyName} (${vendorCode}) / 변경 항목 ${rows.length}건`;
    onSubmit(detail, summary);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="약국명">
        <TextInput required value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} />
      </Field>

      <Field label="약사명">
        <TextInput required value={pharmacistName} onChange={(e) => setPharmacistName(e.target.value)} />
      </Field>

      <Field label="거래처코드">
        <TextInput required value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} />
      </Field>

      <FileUploadField
        label="사업자등록증 사본"
        accept=".pdf,.jpg,.jpeg,.png"
        titleHint={pharmacyName}
        onUploaded={(url) => setBusinessRegFileUrl(url)}
        onUploadingChange={onUploadingChange}
      />

      <Field label="변경 항목" hint="변경하려는 항목명과 기존 값, 변경될 값을 입력하세요. 여러 개면 행을 추가하세요.">
        <RepeatRows
          rows={rows}
          onChange={setRows}
          newRow={emptyRow}
          addLabel="변경 항목 추가"
          renderRow={(row, update, remove) => (
            <div className="flex flex-col gap-2">
              <Field label="변경 항목명">
                <TextInput
                  required
                  placeholder="예: 약국 주소, 대표 전화번호"
                  value={row.field_name}
                  onChange={(e) => update({ field_name: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="기존 값">
                  <TextInput value={row.old_value} onChange={(e) => update({ old_value: e.target.value })} />
                </Field>
                <Field label="변경될 값">
                  <TextInput required value={row.new_value} onChange={(e) => update({ new_value: e.target.value })} />
                </Field>
              </div>
              <button type="button" onClick={remove} className="self-start text-xs text-[#d0492e]">
                이 행 삭제
              </button>
            </div>
          )}
        />
      </Field>

      <PrimaryButton type="submit" disabled={submitting || anyUploading}>
        {anyUploading ? "파일 업로드 중..." : submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
